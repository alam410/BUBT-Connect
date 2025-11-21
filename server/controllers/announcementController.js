// Fetch BUBT notices from the official website
export const getBUBTNotices = async (req, res) => {
  try {
    const response = await fetch("https://www.bubt.edu.bd/Home/all_notice", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return res.json({
        success: false,
        message: "Failed to fetch notices from BUBT website",
      });
    }

    const html = await response.text();

    // Parse notices from HTML table
    const notices = [];
    
    // Extract all table rows
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;
    
    while ((match = rowRegex.exec(html)) !== null) {
      const row = match[1];
      
      // Extract all table cells in this row
      const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells = [];
      let cellMatch;
      
      while ((cellMatch = cellRegex.exec(row)) !== null) {
        cells.push(cellMatch[1]);
      }
      
      // Skip header row or rows without enough cells
      if (cells.length < 3) continue;
      
      // First cell: Notice title with link
      const titleCell = cells[0];
      const linkMatch = titleCell.match(/<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/i);
      
      if (!linkMatch) continue;
      
      const noticeUrl = linkMatch[1];
      let noticeTitle = linkMatch[2]
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim()
        .replace(/\s+/g, " ");
      
      // Skip if title is empty or too short
      if (!noticeTitle || noticeTitle.length < 5) continue;
      
      // Second cell: Category
      const categoryCell = cells[1];
      const category = categoryCell
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim() || "General";
      
      // Third cell: Published date
      const dateCell = cells[2];
      const publishedDate = dateCell
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim() || "";
      
      // Build full URL
      const fullUrl = noticeUrl.startsWith("http")
        ? noticeUrl
        : noticeUrl.startsWith("/")
        ? `https://www.bubt.edu.bd${noticeUrl}`
        : `https://www.bubt.edu.bd/${noticeUrl}`;
      
      notices.push({
        title: noticeTitle,
        category: category,
        publishedDate: publishedDate,
        url: fullUrl,
      });
    }

    // Remove duplicates based on title
    const uniqueNotices = notices.filter(
      (notice, index, self) =>
        index === self.findIndex((n) => n.title === notice.title && n.url === notice.url)
    );

    // Sort by date (newest first) - try to parse dates
    uniqueNotices.sort((a, b) => {
      try {
        const dateA = new Date(a.publishedDate);
        const dateB = new Date(b.publishedDate);
        if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
          return dateB - dateA;
        }
      } catch (e) {
        // If date parsing fails, keep original order
      }
      return 0;
    });

    res.json({
      success: true,
      notices: uniqueNotices,
      total: uniqueNotices.length,
    });
  } catch (error) {
    console.error("Error fetching BUBT notices:", error);
    res.json({
      success: false,
      message: error.message || "Failed to fetch notices",
    });
  }
};

