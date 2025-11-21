import * as cheerio from 'cheerio';

/**
 * Fetch user data from BUBT Annex portal
 * This function logs into the Annex system and fetches student data
 */
export const fetchAnnexUserData = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    console.log('=== Starting Annex Data Fetch ===');
    console.log('Username:', username);

    // Step 1: Get login page and parse form fields
    const loginUrl = 'https://annex.bubt.edu.bd/';
    const studentPortalUrl = 'https://annex.bubt.edu.bd/ONSIS_SEITO/index.php';

    // Fetch login page to get cookies and parse form
    const loginPageResponse = await fetch(loginUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    // Extract and parse cookies
    let cookies = '';
    const setCookieHeader = loginPageResponse.headers.get('set-cookie');
    if (setCookieHeader) {
      // Handle both single and multiple set-cookie headers
      const cookieArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      cookies = cookieArray.map(cookie => {
        const parts = cookie.split(';');
        return parts[0].trim();
      }).join('; ');
    }

    // Parse login form to find actual field names
    const loginHtml = await loginPageResponse.text();
    const $login = cheerio.load(loginHtml);
    
    // Log login page structure for debugging
    console.log('Login page HTML length:', loginHtml.length);
    console.log('Login page contains forms:', $login('form').length);
    
    // Find form action and method
    const form = $login('form').first();
    const formAction = form.attr('action') || '';
    const formMethod = form.attr('method') || 'POST';
    
    // Build full login URL
    let fullLoginUrl = loginUrl;
    if (formAction) {
      fullLoginUrl = formAction.startsWith('http') 
        ? formAction 
        : formAction.startsWith('/')
        ? new URL(formAction, loginUrl).href
        : new URL(formAction, loginUrl).href;
    }
    
    // Find ALL input fields in the form for debugging
    const allInputs = form.find('input');
    console.log('All form inputs found:', allInputs.length);
    allInputs.each((index, element) => {
      const input = $login(element);
      console.log(`Input ${index}:`, {
        type: input.attr('type'),
        name: input.attr('name'),
        id: input.attr('id'),
        placeholder: input.attr('placeholder'),
      });
    });
    
    // Find input fields in the form - try multiple strategies
    let usernameField = form.find('input[type="text"]').first();
    if (usernameField.length === 0) {
      usernameField = form.find('input[name*="user"], input[name*="id"], input[name*="login"], input[name*="student"]').first();
    }
    if (usernameField.length === 0) {
      // Try to find by ID
      usernameField = form.find('input[id*="user"], input[id*="id"], input[id*="login"]').first();
    }
    if (usernameField.length === 0) {
      usernameField = form.find('input:not([type="password"]):not([type="submit"]):not([type="button"]):not([type="hidden"])').first();
    }
    
    const passwordField = form.find('input[type="password"]').first();
    
    let usernameFieldName = usernameField.attr('name') || usernameField.attr('id');
    let passwordFieldName = passwordField.attr('name') || passwordField.attr('id');
    
    // If no form found or fields not found, use common defaults
    if (form.length === 0 || !usernameFieldName) {
      console.log('Form not found or fields not detected, using common field names');
      // Common field names used by BUBT Annex
      usernameFieldName = 'username';
      passwordFieldName = 'password';
    }
    
    console.log('Found form fields:', { 
      usernameFieldName, 
      passwordFieldName, 
      formAction: fullLoginUrl,
      formMethod,
      hasForm: form.length > 0,
      usernameFieldFound: usernameField.length > 0,
      passwordFieldFound: passwordField.length > 0,
      usernameFieldType: usernameField.attr('type'),
      usernameFieldId: usernameField.attr('id'),
    });
    
    // Log the form HTML for debugging
    if (form.length > 0) {
      const formHtml = form.html() || '';
      console.log('Form HTML (first 1000 chars):', formHtml.substring(0, 1000));
    } else {
      console.log('WARNING: No form found in login page!');
      console.log('Login page HTML sample:', loginHtml.substring(0, 2000));
    }

    // Step 2: Attempt to login with correct field names
    const formData = new URLSearchParams();
    
    // Add username and password with the detected field names
    formData.append(usernameFieldName, username);
    formData.append(passwordFieldName, password);
    
    // Add any hidden fields from the form (CSRF tokens, etc.)
    if (form.length > 0) {
      form.find('input[type="hidden"]').each((index, element) => {
        const name = $login(element).attr('name');
        const value = $login(element).attr('value') || '';
        if (name) {
          formData.append(name, value);
          console.log('Added hidden field:', name, '=', value);
        }
      });
      
      // IMPORTANT: Add the submit button name and value if present
      // The button has name="admiNlogin" and a value that might be required
      const submitButton = form.find('button[type="submit"], input[type="submit"]').first();
      if (submitButton.length > 0) {
        const buttonName = submitButton.attr('name');
        const buttonValue = submitButton.attr('value');
        if (buttonName) {
          formData.append(buttonName, buttonValue || '');
          console.log('Added submit button:', buttonName, '=', buttonValue);
        }
      }
    }
    
    console.log('Using primary field name:', usernameFieldName);

    console.log('Attempting login with:', { 
      username, 
      usernameField: usernameFieldName,
      passwordField: passwordFieldName, 
      formAction: fullLoginUrl,
      formDataSize: formData.toString().length
    });

    const authResponse = await fetch(fullLoginUrl, {
      method: formMethod.toUpperCase(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': loginUrl,
        'Origin': 'https://annex.bubt.edu.bd',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      body: formData.toString(),
      redirect: 'manual',
    });

    // Extract cookies from login response - handle multiple set-cookie headers
    let authCookies = '';
    const setCookieHeaders = authResponse.headers.get('set-cookie');
    if (setCookieHeaders) {
      // Handle both single string and array of strings
      const cookieArray = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
      authCookies = cookieArray.map(cookie => {
        // Extract just the name=value part (before first semicolon)
        const parts = cookie.split(';');
        return parts[0].trim();
      }).join('; ');
    }
    
    // Also check for cookies in the response headers (some servers use different header names)
    const allSetCookieHeaders = authResponse.headers.getSetCookie ? authResponse.headers.getSetCookie() : [];
    if (allSetCookieHeaders.length > 0) {
      const additionalCookies = allSetCookieHeaders.map(cookie => {
        const parts = cookie.split(';');
        return parts[0].trim();
      }).join('; ');
      if (additionalCookies) {
        authCookies = authCookies ? `${authCookies}; ${additionalCookies}` : additionalCookies;
      }
    }
    
    // Combine cookies (avoid duplicates)
    const cookieMap = new Map();
    [cookies, authCookies].forEach(cookieString => {
      if (cookieString) {
        cookieString.split(';').forEach(cookie => {
          const trimmed = cookie.trim();
          if (trimmed) {
            const [name] = trimmed.split('=');
            if (name) {
              // Keep the most recent value if duplicate
              cookieMap.set(name.trim(), trimmed);
            }
          }
        });
      }
    });
    const allCookies = Array.from(cookieMap.values()).join('; ');
    
    console.log('Combined cookies:', allCookies);

    // Check if login was successful
    const responseStatus = authResponse.status;
    const responseUrl = authResponse.headers.get('location') || '';
    const responseText = await authResponse.text();
    
    console.log('Login response status:', responseStatus);
    console.log('Login response location:', responseUrl);
    console.log('Login response text length:', responseText.length);
    console.log('Login response text (first 2000 chars):', responseText.substring(0, 2000));
    console.log('Cookies after login:', allCookies.substring(0, 200));

    // Check if login failed - detect login page indicators
    const isLoginPage = responseText.includes('door_animation') || 
                       responseText.includes('validators.js') ||
                       (responseText.includes('login') && responseText.includes('password') && responseText.length < 15000);
    
    if (isLoginPage && responseText.length > 100) {
      console.log('Login failed - detected login page in response');
      // Check for specific error messages
      if (responseText.includes('invalid') || responseText.includes('incorrect') || responseText.includes('wrong')) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Please check your username and password.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Login failed. The form may require different field names or additional authentication steps.',
      });
    }
    
    // If response is empty or very short, it might be a JavaScript redirect
    // Check for meta refresh or script redirects
    if (responseText.length < 100) {
      console.log('Login response is very short - might be a redirect or JavaScript-based');
      // Check for meta refresh
      const metaRefresh = responseText.match(/<meta[^>]*http-equiv=["']refresh["'][^>]*content=["']([^"']+)["']/i);
      if (metaRefresh) {
        console.log('Found meta refresh:', metaRefresh[1]);
      }
    }

    // If we get a redirect, follow it or use the redirect URL
    let finalPortalUrl = studentPortalUrl;
    
    // Check if response contains JavaScript redirect
    const jsRedirectMatch = responseText.match(/window\.location\s*=\s*["']([^"']+)["']/i) || 
                            responseText.match(/location\.href\s*=\s*["']([^"']+)["']/i);
    
    if (jsRedirectMatch) {
      const redirectPath = jsRedirectMatch[1];
      finalPortalUrl = redirectPath.startsWith('http') 
        ? redirectPath 
        : new URL(redirectPath, loginUrl).href;
      console.log('Found JavaScript redirect to:', finalPortalUrl);
    } else if (responseStatus === 302 || responseStatus === 301) {
      if (responseUrl) {
        finalPortalUrl = responseUrl.startsWith('http') ? responseUrl : new URL(responseUrl, loginUrl).href;
        console.log('Following HTTP redirect to:', finalPortalUrl);
      } else {
        // No redirect URL but status is 302 - might be JavaScript redirect
        console.log('302 status but no location header - trying default portal URL');
      }
    } else if (responseStatus === 200) {
      // Check if response is actually the student portal or still login page
      if (responseText.includes('ONSIS_SEITO') || 
          (responseText.includes('Name:') && !responseText.includes('door_animation'))) {
        console.log('Got student portal in 200 response');
        // Use this response directly
        const $ = cheerio.load(responseText);
        return parseAndReturnStudentData($, responseText, username, res);
      }
      
      // If response is empty or very short, it might be a successful login with JavaScript redirect
      // Try the default portal URL
      if (responseText.length < 100) {
        console.log('Empty/short response after login - assuming success, trying portal URL');
        finalPortalUrl = studentPortalUrl;
      }
    }

    // Step 3: Fetch student portal data with proper cookies
    console.log('Fetching portal from:', finalPortalUrl);
    console.log('Using cookies (first 200 chars):', allCookies.substring(0, 200));
    
    const portalResponse = await fetch(finalPortalUrl, {
      method: 'GET',
      headers: {
        'Cookie': allCookies,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': loginUrl,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    const html = await portalResponse.text();
    
    console.log('Portal response status:', portalResponse.status);
    console.log('Portal response URL:', portalResponse.url);
    console.log('HTML length:', html.length);
    
    // Check if we got redirected to login page (means authentication failed)
    if ((html.includes('login') && html.includes('password')) || 
        (html.includes('door_animation') && html.includes('validators.js'))) {
      console.log('Got redirected to login page - authentication failed');
      console.log('HTML contains login page indicators');
      console.log('Portal response URL:', portalResponse.url);
      console.log('Expected portal URL:', finalPortalUrl);
      
      // If we got redirected to the root, the login might have failed
      // But also check if cookies are being sent correctly
      if (portalResponse.url === loginUrl || portalResponse.url === 'https://annex.bubt.edu.bd/') {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed. Please verify your credentials are correct. The session may not have been established properly.',
        });
      }
    }

    if (!portalResponse.ok && portalResponse.status !== 200) {
      console.log('Portal response not OK:', portalResponse.status, portalResponse.statusText);
      return res.status(500).json({
        success: false,
        message: `Failed to fetch student data from Annex portal. Status: ${portalResponse.status}`,
      });
    }

    const $ = cheerio.load(html);
    
    return parseAndReturnStudentData($, html, username, res);
  } catch (error) {
    console.error('=== Error fetching Annex user data ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    console.error('=====================================');
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch data from Annex portal. Please check server logs for details.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Helper function to parse and return student data
function parseAndReturnStudentData($, html, username, res) {
  try {

    // Log HTML structure for debugging (first 5000 chars)
    console.log('Annex Portal HTML (first 5000 chars):', html.substring(0, 5000));

    // Parse student data from the HTML
    // Based on the actual Annex portal structure
    const studentData = {
      studentId: username,
      name: '',
      department: '',
      semester: '',
      batch: '',
      intake: '',
      section: '',
      program: '',
      email: '',
      phone: '',
      cgpa: '',
      courses: [],
      grades: [],
    };

    // Get all text content for better pattern matching
    const allText = $('body').text();
    const bodyHtml = $('body').html() || '';
    
    // Log text content that might contain CGPA (after allText is defined)
    const cgpaRelatedText = allText.match(/[^\n]*CGPA[^\n]*/gi) || allText.match(/[^\n]*GPA[^\n]*/gi) || [];
    if (cgpaRelatedText.length > 0) {
      console.log('CGPA-related text found:', cgpaRelatedText.slice(0, 10));
    } else {
      console.log('No CGPA-related text found in HTML');
      // Also check for common variations
      const gradeRelated = allText.match(/[^\n]*(grade|point|average|score)[^\n]*/gi);
      if (gradeRelated && gradeRelated.length > 0) {
        console.log('Grade-related text found (might contain CGPA):', gradeRelated.slice(0, 5));
      }
    }
    
    // Log a sample of the HTML to see structure
    const cgpaIndex = html.indexOf('CGPA');
    if (cgpaIndex !== -1) {
      console.log('Sample HTML around CGPA:', html.substring(Math.max(0, cgpaIndex - 200), Math.min(html.length, cgpaIndex + 200)));
    } else {
      console.log('CGPA not found in HTML');
    }

    // Strategy 1: Look for "Name:" pattern
    // The portal shows: "Name: Sidratul Muntaha Sumaiya"
    // Try multiple patterns to catch different HTML structures
    const namePatterns = [
      /Name:\s*([^\n\r<]+?)(?:\s*ID:|<|$)/i,
      /Name[:\s]+([A-Za-z\s]+?)(?:\s*ID:|<|$)/i,
    ];
    
    for (const pattern of namePatterns) {
      const match = allText.match(pattern) || html.match(pattern) || bodyHtml.match(pattern);
      if (match && match[1] && !studentData.name) {
        const name = match[1].trim();
        // Filter out common false positives
        if (name && !name.toLowerCase().includes('login') && name.length > 2) {
          studentData.name = name;
          break;
        }
      }
    }

    // Strategy 2: Look for "ID:" pattern with intake/section
    // The portal shows: "ID: 22234103256 Intake/Section: 50 - 7"
    const idPatterns = [
      /ID:\s*(\d+)(?:\s+Intake\/Section:\s*(\d+)\s*-\s*(\d+))?/i,
      /ID[:\s]+(\d+)/i,
    ];
    
    for (const pattern of idPatterns) {
      const match = allText.match(pattern) || html.match(pattern) || bodyHtml.match(pattern);
      if (match && match[1]) {
        studentData.studentId = match[1].trim();
        if (match[2]) studentData.intake = match[2].trim();
        if (match[3]) studentData.section = match[3].trim();
        break;
      }
    }

    // Strategy 3: Look for "Program:" pattern
    // The portal shows: "Program: B.Sc. Engg. in CSE (Bi-Semester)"
    const programPatterns = [
      /Program:\s*([^\n\r<]+?)(?:\s*Notice|Evaluation|Deadline|$)/i,
      /Program[:\s]+([A-Za-z\.\s\(\)]+)/i,
    ];
    
    for (const pattern of programPatterns) {
      const match = allText.match(pattern) || html.match(pattern) || bodyHtml.match(pattern);
      if (match && match[1]) {
        const programText = match[1].trim();
        studentData.program = programText;
        
        // Extract department from program (e.g., "CSE" from "B.Sc. Engg. in CSE")
        const deptMatch = programText.match(/in\s+(\w+)/i);
        if (deptMatch && deptMatch[1]) {
          studentData.department = deptMatch[1].trim();
        }
        
        // Extract semester info from program
        if (programText.includes('Bi-Semester')) {
          studentData.semester = 'Bi-Semester';
        } else if (programText.includes('Tri-Semester')) {
          studentData.semester = 'Tri-Semester';
        }
        break;
      }
    }

    // Strategy 3.5: Extract CGPA from JSON data in canvas element (most reliable)
    // The portal stores CGPA data in a canvas element with data-json attribute
    $('canvas[data-json]').each((index, element) => {
      const jsonData = $(element).attr('data-json');
      if (jsonData && !studentData.cgpa) {
        try {
          const parsed = JSON.parse(jsonData);
          if (parsed.CGPA && Array.isArray(parsed.CGPA) && parsed.CGPA.length > 0) {
            // Get the last CGPA value (most recent semester)
            const lastCGPA = parsed.CGPA[parsed.CGPA.length - 1];
            const cgpaValue = parseFloat(lastCGPA);
            if (!isNaN(cgpaValue) && cgpaValue >= 0 && cgpaValue <= 4.0) {
              studentData.cgpa = cgpaValue.toFixed(2);
              console.log('Found CGPA from canvas JSON data:', studentData.cgpa, 'All CGPAs:', parsed.CGPA);
            }
          }
        } catch (e) {
          console.log('Error parsing canvas JSON data:', e.message);
        }
      }
    });
    
    // Strategy 3.6: Look for CGPA in text patterns (comprehensive search)
    if (!studentData.cgpa) {
      const cgpaPatterns = [
        /CGPA[:\s]+([\d\.]+)/i,
        /GPA[:\s]+([\d\.]+)/i,
        /CGPA\s*[:\-]?\s*([\d\.]+)/i,
        /([\d\.]+)\s*CGPA/i,
        /CGPA\s*=\s*([\d\.]+)/i,
        /CGPA\s*\(([\d\.]+)\)/i,
        /Cumulative\s+GPA[:\s]+([\d\.]+)/i,
        /Grade\s+Point\s+Average[:\s]+([\d\.]+)/i,
      ];
      
      // Search in multiple text sources
      const textSources = [allText, html, bodyHtml];
      for (const textSource of textSources) {
        for (const pattern of cgpaPatterns) {
          const match = textSource.match(pattern);
          if (match && match[1] && !studentData.cgpa) {
            const cgpaValue = parseFloat(match[1]);
            // Allow CGPA up to 4.0 (some systems use 4.0 scale)
            if (!isNaN(cgpaValue) && cgpaValue >= 0 && cgpaValue <= 4.0) {
              studentData.cgpa = cgpaValue.toFixed(2);
              console.log('Found CGPA via pattern:', studentData.cgpa, 'Pattern:', pattern);
              break;
            }
          }
        }
        if (studentData.cgpa) break;
      }
    }
    
    // Also try to find CGPA in specific elements that might contain it
    if (!studentData.cgpa) {
      $('*').each((index, element) => {
        const text = $(element).text();
        const htmlContent = $(element).html() || '';
        
        // Look for elements that contain "CGPA" or "GPA"
        if ((text.includes('CGPA') || text.includes('GPA')) && text.length < 100) {
          const cgpaMatch = text.match(/([\d\.]+)/);
          if (cgpaMatch) {
            const cgpaValue = parseFloat(cgpaMatch[1]);
            if (!isNaN(cgpaValue) && cgpaValue >= 0 && cgpaValue <= 4.0 && !studentData.cgpa) {
              studentData.cgpa = cgpaValue.toFixed(2);
              console.log('Found CGPA in element:', studentData.cgpa, 'Element text:', text.substring(0, 50));
              return false; // Break the loop
            }
          }
        }
      });
    }

    // Strategy 4: Look in specific HTML elements (fallback)
    $('td, div, span, p, li, label').each((index, element) => {
      const text = $(element).text().trim();
      
      // Check for name pattern (more specific)
      if (text.match(/^Name:\s*.+/i) && !studentData.name) {
        const match = text.match(/Name:\s*(.+?)(?:\s*ID:|$)/i);
        if (match && match[1]) {
          const name = match[1].trim();
          if (name && !name.toLowerCase().includes('login') && name.length > 2) {
            studentData.name = name;
          }
        }
      }
      
      // Check for ID with intake/section
      if (text.includes('ID:') && text.includes('Intake/Section:') && !studentData.intake) {
        const match = text.match(/ID:\s*(\d+).*?Intake\/Section:\s*(\d+)\s*-\s*(\d+)/i);
        if (match) {
          if (match[1] && !studentData.studentId) studentData.studentId = match[1].trim();
          if (match[2]) studentData.intake = match[2].trim();
          if (match[3]) studentData.section = match[3].trim();
        }
      }
      
      // Check for program pattern
      if (text.match(/^Program:\s*.+/i) && !studentData.program) {
        const match = text.match(/Program:\s*(.+?)(?:\s*Notice|Evaluation|$)/i);
        if (match && match[1]) {
          studentData.program = match[1].trim();
        }
      }
      
      // Check for CGPA pattern
      if (text.match(/CGPA|GPA/i) && !studentData.cgpa) {
        const cgpaPatterns = [
          /CGPA[:\s]+([\d\.]+)/i,
          /GPA[:\s]+([\d\.]+)/i,
          /CGPA\s*[:\-]?\s*([\d\.]+)/i,
          /([\d\.]+)\s*CGPA/i,
        ];
        
        for (const pattern of cgpaPatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            const cgpaValue = parseFloat(match[1]);
            if (!isNaN(cgpaValue) && cgpaValue >= 0 && cgpaValue <= 4.0) {
              studentData.cgpa = cgpaValue.toFixed(2);
              break;
            }
          }
        }
      }
    });

    // Strategy 5: Extract from specific HTML structure
    // Look for elements that might contain student info
    $('[class*="student"], [id*="student"], [class*="profile"], [id*="profile"]').each((index, element) => {
      const text = $(element).text();
      if (text.includes('Name:') && !studentData.name) {
        const match = text.match(/Name:\s*([^\n\r]+)/i);
        if (match) studentData.name = match[1].trim();
      }
      
      // Also check for CGPA in these elements
      if ((text.includes('CGPA') || text.includes('GPA')) && !studentData.cgpa) {
        const cgpaMatch = text.match(/([\d\.]{1,4})/);
        if (cgpaMatch) {
          const cgpaValue = parseFloat(cgpaMatch[1]);
          if (!isNaN(cgpaValue) && cgpaValue >= 0 && cgpaValue <= 4.0) {
            studentData.cgpa = cgpaValue.toFixed(2);
            console.log('Found CGPA in student/profile element:', studentData.cgpa);
          }
        }
      }
    });
    
    // Strategy 6: Last resort - look for any element containing "CGPA" or "GPA" and extract nearby numbers
    if (!studentData.cgpa) {
      $('*').each((index, element) => {
        const text = $(element).text();
        const htmlContent = $(element).html() || '';
        
        // If element contains CGPA/GPA and is relatively short, it might be the CGPA display
        if ((text.includes('CGPA') || text.includes('GPA')) && text.length < 200) {
          // Try to extract number from this element or its siblings
          const numberMatch = text.match(/([\d\.]{1,4})/);
          if (numberMatch) {
            const cgpaValue = parseFloat(numberMatch[1]);
            if (!isNaN(cgpaValue) && cgpaValue >= 0 && cgpaValue <= 4.0) {
              studentData.cgpa = cgpaValue.toFixed(2);
              console.log('Found CGPA in element (last resort):', studentData.cgpa, 'Element:', text.substring(0, 100));
              return false; // Break the loop
            }
          }
          
          // Also check parent and sibling elements
          const parent = $(element).parent();
          const siblings = $(element).siblings();
          const combinedText = parent.text() + ' ' + siblings.text();
          const combinedMatch = combinedText.match(/([\d\.]{1,4})/);
          if (combinedMatch) {
            const cgpaValue = parseFloat(combinedMatch[1]);
            if (!isNaN(cgpaValue) && cgpaValue >= 0 && cgpaValue <= 4.0) {
              studentData.cgpa = cgpaValue.toFixed(2);
              console.log('Found CGPA in parent/sibling:', studentData.cgpa);
              return false;
            }
          }
        }
      });
    }

    // Set defaults to 'N/A' if still empty
    studentData.name = studentData.name || 'N/A';
    studentData.department = studentData.department || 'N/A';
    studentData.semester = studentData.semester || 'N/A';
    studentData.batch = studentData.batch || studentData.intake || 'N/A';
    studentData.email = studentData.email || 'N/A';
    studentData.phone = studentData.phone || 'N/A';
    studentData.cgpa = studentData.cgpa || 'N/A';
    
    // Format semester/batch display
    if (studentData.intake && studentData.section) {
      studentData.semester = `${studentData.intake} - ${studentData.section}`;
    }

    // Try to extract courses and grades from tables
    // Also look for CGPA in semester results tables
    const semesterCGPAs = []; // Store all semester CGPAs to find the latest
    
    $('table').each((tableIndex, table) => {
      const tableText = $(table).text();
      let currentSemester = null;
      let foundCGPARow = false;
      
      $(table).find('tr').each((index, element) => {
        const cells = $(element).find('td, th');
        if (cells.length >= 2) {
          const firstCell = $(cells[0]).text().trim();
          const secondCell = $(cells[1]).text().trim();
          const thirdCell = cells.length >= 3 ? $(cells[2]).text().trim() : '';
          const fourthCell = cells.length >= 4 ? $(cells[3]).text().trim() : '';
          const rowText = firstCell + ' ' + secondCell + ' ' + thirdCell + ' ' + fourthCell;
          
          // Check if this row contains semester information
          if (firstCell.match(/semester|term|level/i) || firstCell.match(/^\d+[st|nd|rd|th]?\s*(semester|term)/i)) {
            currentSemester = firstCell;
            console.log('Found semester row:', currentSemester);
          }
          
          // Check for CGPA in table cells - look for "CGPA" label
          if (!foundCGPARow && rowText.match(/CGPA|GPA/i)) {
            foundCGPARow = true;
            // Try multiple patterns
            const cgpaPatterns = [
              /CGPA[:\s]+([\d\.]+)/i,
              /GPA[:\s]+([\d\.]+)/i,
              /([\d\.]+)\s*CGPA/i,
              /([\d\.]+)\s*GPA/i,
            ];
            
            for (const pattern of cgpaPatterns) {
              const match = rowText.match(pattern);
              if (match && match[1]) {
                const cgpaValue = parseFloat(match[1]);
                if (!isNaN(cgpaValue) && cgpaValue >= 0 && cgpaValue <= 4.0) {
                  const cgpaData = {
                    value: cgpaValue.toFixed(2),
                    semester: currentSemester || 'Unknown',
                    rowIndex: index,
                  };
                  semesterCGPAs.push(cgpaData);
                  console.log('Found CGPA in table:', cgpaData);
                  
                  // If this is the first CGPA found and we don't have one yet, use it
                  if (!studentData.cgpa) {
                    studentData.cgpa = cgpaData.value;
                  }
                  break;
                }
              }
            }
            
            // If no pattern match, try to find any number in the row that looks like CGPA
            if (!studentData.cgpa || semesterCGPAs.length === 0) {
              const numberMatch = rowText.match(/([\d\.]{1,4})/);
              if (numberMatch) {
                const cgpaValue = parseFloat(numberMatch[1]);
                if (!isNaN(cgpaValue) && cgpaValue >= 0 && cgpaValue <= 4.0) {
                  const cgpaData = {
                    value: cgpaValue.toFixed(2),
                    semester: currentSemester || 'Unknown',
                    rowIndex: index,
                  };
                  semesterCGPAs.push(cgpaData);
                  if (!studentData.cgpa) {
                    studentData.cgpa = cgpaData.value;
                    console.log('Found CGPA in table (fallback):', cgpaData);
                  }
                }
              }
            }
          }
          
          // Also check if a cell directly contains a CGPA value (numeric between 0-4)
          if (!foundCGPARow && cells.length >= 2) {
            // Check each cell for a CGPA-like value
            cells.each((cellIndex, cell) => {
              const cellText = $(cell).text().trim();
              const cellValue = parseFloat(cellText);
              // If it's a number between 0-4 and looks like CGPA (has 1-2 decimal places)
              if (!isNaN(cellValue) && cellValue >= 0 && cellValue <= 4.0 && 
                  cellText.match(/^\d\.\d{1,2}$/)) {
                // Check if previous or next cell contains "CGPA" or "GPA"
                const prevCell = cellIndex > 0 ? $(cells[cellIndex - 1]).text().trim() : '';
                const nextCell = cellIndex < cells.length - 1 ? $(cells[cellIndex + 1]).text().trim() : '';
                if (prevCell.match(/CGPA|GPA/i) || nextCell.match(/CGPA|GPA/i) || 
                    firstCell.match(/CGPA|GPA/i) || secondCell.match(/CGPA|GPA/i)) {
                  const cgpaData = {
                    value: cellValue.toFixed(2),
                    semester: currentSemester || 'Unknown',
                    rowIndex: index,
                  };
                  semesterCGPAs.push(cgpaData);
                  if (!studentData.cgpa) {
                    studentData.cgpa = cgpaData.value;
                    console.log('Found CGPA value in cell:', cgpaData);
                  }
                }
              }
            });
          }
          
          // Check if this looks like a course row (has course code pattern)
          if (firstCell && (firstCell.match(/^[A-Z]{2,4}\d{3,4}/) || firstCell.length < 20)) {
            studentData.courses.push({
              code: firstCell,
              name: secondCell || 'N/A',
              grade: thirdCell || 'N/A',
            });
          }
        }
      });
    });
    
    // If we found multiple semester CGPAs, use the last one (most recent)
    if (semesterCGPAs.length > 1) {
      // Sort by row index (later rows = more recent) or keep the last one
      const latestCGPA = semesterCGPAs[semesterCGPAs.length - 1];
      studentData.cgpa = latestCGPA.value;
      console.log('Using latest semester CGPA:', latestCGPA);
    } else if (semesterCGPAs.length === 1) {
      studentData.cgpa = semesterCGPAs[0].value;
      console.log('Using found CGPA:', semesterCGPAs[0]);
    }

    // If no courses found in tables, try other selectors
    if (studentData.courses.length === 0) {
      $('.course, .subject, [class*="course"], [class*="subject"]').each((index, element) => {
        const courseText = $(element).text().trim();
        if (courseText && courseText.length > 3) {
          studentData.courses.push({
            code: courseText.split(' ')[0] || 'N/A',
            name: courseText,
            grade: 'N/A',
          });
        }
      });
    }

    // Log parsed data for debugging
    console.log('=== Parsed Student Data ===');
    console.log(JSON.stringify(studentData, null, 2));
    console.log('==========================');

    // Check if we got meaningful data
    const hasData = studentData.name !== 'N/A' || 
                   studentData.department !== 'N/A' || 
                   studentData.program !== '';

    if (!hasData) {
      console.warn('Warning: Most fields are N/A - parsing may have failed');
      console.log('HTML sample (chars 1000-2000):', html.substring(1000, 2000));
      console.log('Looking for student info patterns in HTML...');
      
      // Try to find any student-related content
      const hasStudentContent = html.includes('Name:') || 
                               html.includes('ID:') || 
                               html.includes('Program:') ||
                               html.includes('student') ||
                               html.includes('ONSIS_SEITO');
      console.log('Has student content indicators:', hasStudentContent);
    }

    res.json({
      success: true,
      data: studentData,
      message: hasData 
        ? 'Student data fetched successfully' 
        : 'Data fetched but some fields could not be parsed. The portal structure may have changed.',
    });
  } catch (parseError) {
    console.error('Error parsing student data:', parseError);
    throw parseError;
  }
}

