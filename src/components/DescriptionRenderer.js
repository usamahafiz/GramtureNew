import React, { useEffect, useRef } from "react";

const DescriptionRenderer = ({ description }) => {
  const descriptionRef = useRef(null);

  useEffect(() => {
    if (descriptionRef.current) {
      const images = descriptionRef.current.querySelectorAll("img");
      images.forEach((img) => {
        img.style.maxWidth = "80%";
        img.style.height = "auto";
        img.style.display = "block";
        img.style.margin = "0 auto";
        img.style.borderRadius = "8px"; 
      });
    }
  }, [description]);

  if (!description) return "No description available";

  const words = description.split(" ");
  const truncatedDescription =
    words.slice(0, 8).join(" ") + (words.length > 25 ? "..." : "");

  return (
    <div
      ref={descriptionRef}
      style={{
        maxHeight: "100px",
        overflowY: "auto",
        overflowX: "hidden",
        wordWrap: "break-word",
        padding: "10px",
        background: "#f9f9f9",
        borderRadius: "8px",
      }}
      dangerouslySetInnerHTML={{ __html: truncatedDescription }}
    />
  );
};
export default DescriptionRenderer;