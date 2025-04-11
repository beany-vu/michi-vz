// import React from "react";
// import { render } from "@testing-library/react";
// import "@testing-library/jest-dom"; // For the "toBeInTheDocument" matcher
// import Title from "./Title";

// describe("<Title />", () => {
//   it("renders without crashing", () => {
//     render(
//       <svg>
//         <Title x={0} y={0}>
//           Test Title
//         </Title>
//       </svg>
//     );
//   });

//   it("receives x and y as numbers and children as string", () => {
//     const { getByText } = render(
//       <svg>
//         <Title x={100} y={50}>
//           Test Title
//         </Title>
//       </svg>
//     );

//     const title = getByText("Test Title");

//     expect(title).toBeInTheDocument();
//     // Checking the attributes of the rendered element
//     expect(title).toHaveAttribute("x", "100");
//     expect(title).toHaveAttribute("y", "50");
//   });

//   it("renders the correct title text", () => {
//     const { getByText } = render(
//       <svg>
//         <Title x={0} y={0}>
//           Another Test Title
//         </Title>
//       </svg>
//     );
//     expect(getByText("Another Test Title")).toBeInTheDocument();
//   });
// });
