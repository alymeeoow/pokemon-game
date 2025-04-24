import React from "react";


const Button = ({ children, size = "base", variant = "solid", className = "", ...props }) => {
  const sizeClass = `btn-${size}`;
  const variantClass = `btn-${variant}`;

  return (
    <button
      className={`btn ${sizeClass} ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export { Button };
