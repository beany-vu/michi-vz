// create a loading indicator component that can fade in and out with gray background

import React from "react";
import styled, { keyframes } from "styled-components";

const fadeInOut = keyframes`
  0% {
    opacity: 0;
  }
  50% {
    opacity: 0.2;
  }
  100% {
    opacity: 0;
  }
`;

const LoadingIndicatorStyled = styled.div`
  position: absolute;
  top: 5px;
  left: 5px;
  right: 5px;
  bottom: 5px;
  background-color: pink;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: ${fadeInOut} 0.9s linear infinite;
  cursor: wait;
  pointer-events: none;
`;

const LoadingIndicator = () => {
  return <LoadingIndicatorStyled />;
};

export default LoadingIndicator;
