import React, { useEffect, useState } from "react";
import {
  FaCubes,
  FaRocket,
  FaChartPie,
  FaBook,
  FaLightbulb,
  FaTree,
  FaHeart,
  FaCompass,
} from "react-icons/fa";
import { GiSoccerBall } from "react-icons/gi"; // replacement for FaFootballBall
import "./Loading.css"; // custom keyframes

const icons = [
  <FaBook key="1" />,
  <FaLightbulb key="2" />,
  <FaTree key="3" />,
  <FaHeart key="4" />,
  <FaRocket key="5" />,
  <GiSoccerBall key="6" />,
];

const Loading = () => {
  const [counter, setCounter] = useState(0);
  const [percent, setPercent] = useState(0);

  // change icon every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((prev) => (prev + 1) % icons.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // percentage counter
  useEffect(() => {
    const interval = setInterval(() => {
      setPercent((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 120);
    return () => clearInterval(interval);
  }, []);

return (
  <div className="flex items-center justify-center h-screen w-full">
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="text-[40px] animate-rotate-gradient">
        {icons[counter]}
      </div>
      <span className="text-center font-[Lato] text-black">
        {percent}%
      </span>
    </div>
  </div>
);


};

export default Loading;
