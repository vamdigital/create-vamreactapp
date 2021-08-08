import { render, screen } from "@testing-library/react";
import App from "lib/Components/App";
import React from "react";

test("renders hey 👋", () => {
  render(<App />);
  const linkElement = screen.getByText(/hey 👋/i);
  expect(linkElement).toBeInTheDocument();
});
