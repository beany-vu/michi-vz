"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const styled_components_1 = __importStar(require("styled-components"));
const fadeInOut = (0, styled_components_1.keyframes) `
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
const LoadingIndicatorStyled = styled_components_1.default.div `
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
    return (0, jsx_runtime_1.jsx)(LoadingIndicatorStyled, {});
};
exports.default = LoadingIndicator;
