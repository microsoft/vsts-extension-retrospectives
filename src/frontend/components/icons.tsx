import React from "react";

const retrospectiveLogoUrl = "images/logos/logo_navbar.svg";

export const CloseIcon = () => {
  return (
    <svg className="icon-close" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
};

export const CoffeeIcon = () => {
  return (
    <svg className="icon-coffee" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M16 5v8c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V5h10m4-2H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm-2 5V5h2v3h-2zm2 11H2v2h18v-2z" />
    </svg>
  );
};

export const OpenWithIcon = () => {
  return (
    <svg className="icon-open-with" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z" />
    </svg>
  );
};

export const PrivacyTipIcon = () => {
  return (
    <svg className="icon-privacy-tip" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <g>
        <path d="M12,3.19l7,3.11V11c0,4.52-2.98,8.69-7,9.93C7.98,19.69,5,15.52,5,11V6.3L12,3.19 M12,1L3,5v6c0,5.55,3.84,10.74,9,12 c5.16-1.26,9-6.45,9-12V5L12,1L12,1z M11,7h2v2h-2V7z M11,11h2v6h-2V11z" />
      </g>
    </svg>
  );
};

export const EyeIcon = () => {
  return (
    <svg className="icon-eye" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M12 6.5c3.79 0 7.17 2.13 8.82 5.5-1.65 3.37-5.02 5.5-8.82 5.5S4.83 15.37 3.18 12C4.83 8.63 8.21 6.5 12 6.5m0-2C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5-2.5-1.12-2.5-2.5 1.12-2.5 2.5-2.5m0-2c-2.48 0-4.5 2.02-4.5 4.5s2.02 4.5 4.5 4.5 4.5-2.02 4.5-4.5-2.02-4.5-4.5-4.5z" />
    </svg>
  );
};

export const AssessmentIcon = () => {
  return (
    <svg className="icon-assessment" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" />
    </svg>
  );
};

export const PlayCircleIcon = () => {
  return (
    <svg className="icon-play-circle icon-retrospective-logo" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 16 16" width="24" fill="currentColor" aria-hidden="true">
      <rect x="2" y="0" width="1" height="1" opacity="0.3765" />
      <rect x="3" y="0" width="1" height="1" opacity="0.251" />
      <rect x="4" y="0" width="1" height="1" opacity="0.0627" />
      <rect x="0" y="1" width="1" height="1" opacity="0.0627" />
      <rect x="1" y="1" width="1" height="1" opacity="0.6902" />
      <rect x="2" y="1" width="1" height="1" opacity="0.6275" />
      <rect x="3" y="1" width="1" height="1" opacity="0.7529" />
      <rect x="4" y="1" width="2" height="1" opacity="0.9412" />
      <rect x="6" y="1" width="1" height="1" opacity="0.7529" />
      <rect x="7" y="1" width="1" height="1" opacity="0.502" />
      <rect x="8" y="1" width="1" height="1" opacity="0.3137" />
      <rect x="9" y="1" width="1" height="1" opacity="0.1255" />
      <rect x="0" y="2" width="1" height="1" opacity="0.251" />
      <rect x="1" y="2" width="1" height="1" opacity="0.6902" />
      <rect x="5" y="2" width="1" height="1" opacity="0.0627" />
      <rect x="6" y="2" width="1" height="1" opacity="0.251" />
      <rect x="7" y="2" width="1" height="1" opacity="0.502" />
      <rect x="8" y="2" width="1" height="1" opacity="0.6902" />
      <rect x="9" y="2" width="1" height="1" opacity="0.8157" />
      <rect x="10" y="2" width="1" height="1" />
      <rect x="11" y="2" width="1" height="1" opacity="0.3137" />
      <rect x="0" y="3" width="1" height="1" opacity="0.4392" />
      <rect x="1" y="3" width="1" height="1" opacity="0.502" />
      <rect x="10" y="3" width="1" height="1" opacity="0.0627" />
      <rect x="11" y="3" width="1" height="1" opacity="0.8784" />
      <rect x="12" y="3" width="1" height="1" opacity="0.0627" />
      <rect x="0" y="4" width="1" height="1" opacity="0.6275" />
      <rect x="1" y="4" width="1" height="1" opacity="0.3137" />
      <rect x="11" y="4" width="1" height="1" opacity="0.8157" />
      <rect x="12" y="4" width="1" height="1" opacity="0.1255" />
      <rect x="0" y="5" width="1" height="1" opacity="0.8157" />
      <rect x="1" y="5" width="1" height="1" opacity="0.1255" />
      <rect x="11" y="5" width="1" height="1" />
      <rect x="0" y="6" width="1" height="1" opacity="0.9412" />
      <rect x="10" y="6" width="1" height="1" opacity="0.251" />
      <rect x="11" y="6" width="1" height="1" opacity="0.8157" />
      <rect x="12" y="6" width="1" height="1" opacity="0.251" />
      <rect x="13" y="6" width="2" height="1" opacity="0.4392" />
      <rect x="0" y="7" width="1" height="1" opacity="0.8157" />
      <rect x="1" y="7" width="1" height="1" opacity="0.0627" />
      <rect x="7" y="7" width="1" height="1" opacity="0.3137" />
      <rect x="8" y="7" width="2" height="1" opacity="0.7529" />
      <rect x="10" y="7" width="5" height="1" />
      <rect x="15" y="7" width="1" height="1" opacity="0.502" />
      <rect x="0" y="8" width="1" height="1" opacity="0.5647" />
      <rect x="1" y="8" width="1" height="1" opacity="0.9412" />
      <rect x="2" y="8" width="1" height="1" opacity="0.7529" />
      <rect x="4" y="8" width="1" height="1" opacity="0.0627" />
      <rect x="5" y="8" width="1" height="1" opacity="0.1882" />
      <rect x="7" y="8" width="8" height="1" />
      <rect x="15" y="8" width="1" height="1" opacity="0.7529" />
      <rect x="2" y="9" width="1" height="1" opacity="0.9412" />
      <rect x="3" y="9" width="1" height="1" opacity="0.1882" />
      <rect x="4" y="9" width="1" height="1" opacity="0.8157" />
      <rect x="5" y="9" width="1" height="1" opacity="0.7529" />
      <rect x="6" y="9" width="1" height="1" opacity="0.9412" />
      <rect x="7" y="9" width="8" height="1" />
      <rect x="15" y="9" width="1" height="1" opacity="0.8157" />
      <rect x="1" y="10" width="1" height="1" opacity="0.251" />
      <rect x="2" y="10" width="1" height="1" opacity="0.9412" />
      <rect x="3" y="10" width="1" height="1" opacity="0.8784" />
      <rect x="4" y="10" width="1" height="1" opacity="0.3765" />
      <rect x="7" y="10" width="1" height="1" opacity="0.8157" />
      <rect x="8" y="10" width="8" height="1" />
      <rect x="1" y="11" width="1" height="1" opacity="0.3765" />
      <rect x="2" y="11" width="1" height="1" opacity="0.8157" />
      <rect x="3" y="11" width="1" height="1" opacity="0.1882" />
      <rect x="7" y="11" width="1" height="1" opacity="0.7529" />
      <rect x="8" y="11" width="8" height="1" />
      <rect x="1" y="12" width="1" height="1" opacity="0.251" />
      <rect x="2" y="12" width="1" height="1" opacity="0.0627" />
      <rect x="7" y="12" width="1" height="1" opacity="0.5647" />
      <rect x="8" y="12" width="6" height="1" />
      <rect x="14" y="12" width="1" height="1" opacity="0.8157" />
      <rect x="15" y="12" width="1" height="1" opacity="0.4392" />
      <rect x="7" y="13" width="1" height="1" opacity="0.0627" />
      <rect x="8" y="13" width="2" height="1" opacity="0.4392" />
      <rect x="10" y="13" width="1" height="1" opacity="0.251" />
      <rect x="11" y="13" width="1" height="1" opacity="0.502" />
      <rect x="12" y="13" width="2" height="1" />
      <rect x="14" y="13" width="1" height="1" opacity="0.6275" />
      <rect x="12" y="14" width="1" height="1" opacity="0.1882" />
      <rect x="13" y="14" width="1" height="1" opacity="0.8784" />
      <rect x="14" y="14" width="1" height="1" opacity="0.9412" />
      <rect x="15" y="14" width="1" height="1" opacity="0.0627" />
      <rect x="13" y="15" width="1" height="1" opacity="0.0627" />
      <rect x="14" y="15" width="1" height="1" opacity="0.5647" />
      <rect x="15" y="15" width="1" height="1" opacity="0.3765" />
    </svg>
  );
};

export const PauseCircleIcon = () => {
  return (
    <svg className="icon-pause-circle" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M11,16H9V8h2V16z M15,16h-2V8h2V16z" />
    </svg>
  );
};

export const StopCircleIcon = () => {
  return (
    <svg className="icon-stop-circle" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M12,2C6.48,2,2,6.48,2,12c0,5.52,4.48,10,10,10s10-4.48,10-10C22,6.48,17.52,2,12,2z M12,20c-4.42,0-8-3.58-8-8s3.58-8,8-8 s8,3.58,8,8S16.42,20,12,20z M16,16H8V8h8V16z" />
    </svg>
  );
};

export const RefreshIcon = () => {
  return (
    <svg className="icon-refresh" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
    </svg>
  );
};

export const InfoIcon = () => {
  return (
    <svg className="icon-info" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M11,7h2v2h-2V7z M11,11h2v6h-2V11z M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,20 c-4.41,0-8-3.59-8-8s3.59-8,8-8s8,3.59,8,8S16.41,20,12,20z" />
    </svg>
  );
};

export const ExclamationIcon = () => {
  return (
    <svg className="icon-exclamation" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
    </svg>
  );
};

export const PersonIcon = () => {
  return (
    <svg className="icon-person" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M12 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2m0 10c2.7 0 5.8 1.29 6 2H6c.23-.72 3.31-2 6-2m0-12C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
};

export const PeopleIcon = () => {
  return (
    <svg className="icon-people" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M10.27,12h3.46c0.93,0,1.63-0.83,1.48-1.75l-0.3-1.79C14.67,7.04,13.44,6,12,6S9.33,7.04,9.09,8.47l-0.3,1.79 C8.64,11.17,9.34,12,10.27,12z M11.06,8.79C11.14,8.33,11.53,8,12,8s0.86,0.33,0.94,0.79l0.2,1.21h-2.28L11.06,8.79z" />
      <path d="M1.66,11.11c-0.13,0.26-0.18,0.57-0.1,0.88c0.16,0.69,0.76,1.03,1.53,1c0,0,1.49,0,1.95,0c0.83,0,1.51-0.58,1.51-1.29 c0-0.14-0.03-0.27-0.07-0.4c-0.01-0.03-0.01-0.05,0.01-0.08c0.09-0.16,0.14-0.34,0.14-0.53c0-0.31-0.14-0.6-0.36-0.82 c-0.03-0.03-0.03-0.06-0.02-0.1c0.07-0.2,0.07-0.43,0.01-0.65C6.1,8.69,5.71,8.4,5.27,8.38c-0.03,0-0.05-0.01-0.07-0.03 C5.03,8.14,4.72,8,4.37,8C4.07,8,3.8,8.1,3.62,8.26C3.59,8.29,3.56,8.29,3.53,8.28c-0.14-0.06-0.3-0.09-0.46-0.09 c-0.65,0-1.18,0.49-1.24,1.12c0,0.02-0.01,0.04-0.03,0.06c-0.29,0.26-0.46,0.65-0.41,1.05c0.03,0.22,0.12,0.43,0.25,0.6 C1.67,11.04,1.67,11.08,1.66,11.11z" />
      <path d="M16.24,13.65c-1.17-0.52-2.61-0.9-4.24-0.9c-1.63,0-3.07,0.39-4.24,0.9C6.68,14.13,6,15.21,6,16.39V18h12v-1.61 C18,15.21,17.32,14.13,16.24,13.65z M8.07,16c0.09-0.23,0.27-0.42,0.49-0.52c1.1-0.49,2.26-0.73,3.43-0.73 c1.18,0,2.33,0.25,3.43,0.73c0.23,0.1,0.4,0.29,0.49,0.52H8.07z" />
      <path d="M1.22,14.58C0.48,14.9,0,15.62,0,16.43V18l4.5,0v-1.61c0-0.83,0.23-1.61,0.63-2.29C4.76,14.04,4.39,14,4,14 C3.01,14,2.07,14.21,1.22,14.58z" />
      <path d="M22.78,14.58C21.93,14.21,20.99,14,20,14c-0.39,0-0.76,0.04-1.13,0.1c0.4,0.68,0.63,1.46,0.63,2.29V18l4.5,0v-1.57 C24,15.62,23.52,14.9,22.78,14.58z" />
      <path d="M22,11v-0.5c0-1.1-0.9-2-2-2h-2c-0.42,0-0.65,0.48-0.39,0.81l0.7,0.63C18.12,10.25,18,10.61,18,11c0,1.1,0.9,2,2,2 S22,12.1,22,11z" />
    </svg>
  );
};

export const CloudIcon = () => {
  return (
    <svg className="icon-cloud" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6m0-2C9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96C18.67 6.59 15.64 4 12 4z" />
    </svg>
  );
};

export const CloudDownloadIcon = () => {
  return (
    <svg className="icon-cloud-download" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3zm-5.55-8h-2.9v3H8l4 4 4-4h-2.55z" />
    </svg>
  );
};

export const CloudUploadIcon = () => {
  return (
    <svg className="icon-cloud-upload" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3zM8 13h2.55v3h2.9v-3H16l-4-4z" />
    </svg>
  );
};

export const HelpIcon = () => {
  return (
    <svg className="icon-help" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" />
    </svg>
  );
};

export const CelebrationIcon = () => {
  return (
    <svg className="icon-celebration" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <polygon points="2,22 16,17 7,8" />
      <path d="M14.53,12.53l5.59-5.59c0.49-0.49,1.28-0.49,1.77,0l0.59,0.59l1.06-1.06l-0.59-0.59c-1.07-1.07-2.82-1.07-3.89,0 l-5.59,5.59L14.53,12.53z" />
      <path d="M10.06,6.88L9.47,7.47l1.06,1.06l0.59-0.59c1.07-1.07,1.07-2.82,0-3.89l-0.59-0.59L9.47,4.53l0.59,0.59 C10.54,5.6,10.54,6.4,10.06,6.88z" />
      <path d="M17.06,11.88l-1.59,1.59l1.06,1.06l1.59-1.59c0.49-0.49,1.28-0.49,1.77,0l1.61,1.61l1.06-1.06l-1.61-1.61 C19.87,10.81,18.13,10.81,17.06,11.88z" />
      <path d="M15.06,5.88l-3.59,3.59l1.06,1.06l3.59-3.59c1.07-1.07,1.07-2.82,0-3.89l-1.59-1.59l-1.06,1.06l1.59,1.59 C15.54,4.6,15.54,5.4,15.06,5.88z" />
    </svg>
  );
};

export const KeyboardIcon = () => {
  return (
    <svg className="icon-keyboard" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z" />
    </svg>
  );
};

export const MenuBookIcon = () => {
  return (
    <svg className="icon-menu-book" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M21,5c-1.11-0.35-2.33-0.5-3.5-0.5c-1.95,0-4.05,0.4-5.5,1.5c-1.45-1.1-3.55-1.5-5.5-1.5S2.45,4.9,1,6v14.65 c0,0.25,0.25,0.5,0.5,0.5c0.1,0,0.15-0.05,0.25-0.05C3.1,20.45,5.05,20,6.5,20c1.95,0,4.05,0.4,5.5,1.5c1.35-0.85,3.8-1.5,5.5-1.5 c1.65,0,3.35,0.3,4.75,1.05c0.1,0.05,0.15,0.05,0.25,0.05c0.25,0,0.5-0.25,0.5-0.5V6C22.4,5.55,21.75,5.25,21,5z M21,18.5 c-1.1-0.35-2.3-0.5-3.5-0.5c-1.7,0-4.15,0.65-5.5,1.5V8c1.35-0.85,3.8-1.5,5.5-1.5c1.2,0,2.4,0.15,3.5,0.5V18.5z" />
      <path d="M17.5,10.5c0.88,0,1.73,0.09,2.5,0.26V9.24C19.21,9.09,18.36,9,17.5,9c-1.7,0-3.24,0.29-4.5,0.83v1.66 C14.13,10.85,15.7,10.5,17.5,10.5z" />
      <path d="M13,12.49v1.66c1.13-0.64,2.7-0.99,4.5-0.99c0.88,0,1.73,0.09,2.5,0.26V11.9c-0.79-0.15-1.64-0.24-2.5-0.24 C15.8,11.66,14.26,11.96,13,12.49z" />
      <path d="M17.5,14.33c-1.7,0-3.24,0.29-4.5,0.83v1.66c1.13-0.64,2.7-0.99,4.5-0.99c0.88,0,1.73,0.09,2.5,0.26v-1.52 C19.21,14.41,18.36,14.33,17.5,14.33z" />
    </svg>
  );
};

export const VolunteerActivismIcon = () => {
  return (
    <svg className="icon-volunteer-activism" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <rect height="11" width="4" x="1" y="11" />
      <path d="M16,3.25C16.65,2.49,17.66,2,18.7,2C20.55,2,22,3.45,22,5.3c0,2.27-2.91,4.9-6,7.7c-3.09-2.81-6-5.44-6-7.7 C10,3.45,11.45,2,13.3,2C14.34,2,15.35,2.49,16,3.25z" />
      <path d="M20,17h-7l-2.09-0.73l0.33-0.94L13,16h2.82c0.65,0,1.18-0.53,1.18-1.18v0c0-0.49-0.31-0.93-0.77-1.11L8.97,11H7v9.02 L14,22l8.01-3v0C22,17.9,21.11,17,20,17z" />
    </svg>
  );
};

export const ContactPhoneIcon = () => {
  return (
    <svg className="icon-contact-phone" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M22 3H2C.9 3 0 3.9 0 5v14c0 1.1.9 2 2 2h20c1.1 0 1.99-.9 1.99-2L24 5c0-1.1-.9-2-2-2zM8 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H2v-1c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1zm3.85-4h1.64L21 16l-1.99 1.99c-1.31-.98-2.28-2.38-2.73-3.99-.18-.64-.28-1.31-.28-2s.1-1.36.28-2c.45-1.62 1.42-3.01 2.73-3.99L21 8l-1.51 2h-1.64c-.22.63-.35 1.3-.35 2s.13 1.37.35 2z" />
    </svg>
  );
};

export const MoreHorizontalIcon = () => {
  return (
    <svg className="icon-more-horizontal" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  );
};

export const AddIcon = () => {
  return (
    <svg className="icon-add" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  );
};

export const AddCircleIcon = () => {
  return (
    <svg className="icon-add-circle" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
    </svg>
  );
};

export const ContentCopyIcon = () => {
  return (
    <svg className="icon-content-copy" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
    </svg>
  );
};

export const EditIcon = () => {
  return (
    <svg className="icon-edit" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
};

export const LinkIcon = () => {
  return (
    <svg className="icon-link" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
    </svg>
  );
};

export const ReportProblemIcon = () => {
  return (
    <svg className="icon-report-problem" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M12 5.99L19.53 19H4.47L12 5.99M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z" />
    </svg>
  );
};

export const ReportIcon = () => {
  return (
    <svg className="icon-report" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M15.73 3H8.27L3 8.27v7.46L8.27 21h7.46L21 15.73V8.27L15.73 3zM11 7h2v6h-2V7zm0 8h2v2h-2v-2z" />
    </svg>
  );
};

export const SimCardDownloadIcon = () => {
  return (
    <svg className="icon-sim-card-download" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M18,2h-8L4,8v12c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V4C20,2.9,19.1,2,18,2z M12,17l-4-4h3V9.02L13,9v4h3L12,17z" />
    </svg>
  );
};

export const ForwardToInboxIcon = () => {
  return (
    <svg className="icon-forward-to-inbox" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M20,4H4C2.9,4,2,4.9,2,6v12c0,1.1,0.9,2,2,2h9v-2H4V8l8,5l8-5v5h2V6C22,4.9,21.1,4,20,4z M12,11L4,6h16L12,11z M19,15l4,4 l-4,4v-3h-4v-2h4V15z" />
    </svg>
  );
};

export const SourceIcon = () => {
  return (
    <svg className="icon-source" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M20,6h-8.17l-2-2H4C2.9,4,2.01,4.9,2.01,6L2,18c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V8C22,6.9,21.1,6,20,6z M20,18H4V6h5.17l2,2H20V18z M18,10H6v2h12V10z M14,14H6v2h8V14z" />
    </svg>
  );
};

export const InventoryIcon = () => {
  return (
    <svg className="icon-inventory" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4l16-.02V7z" />
    </svg>
  );
};

export const SMSIcon = () => {
  return (
    <svg className="icon-sms" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z" />
    </svg>
  );
};

export const NoteAddIcon = () => {
  return (
    <svg className="icon-note-add" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 14h-3v3h-2v-3H8v-2h3v-3h2v3h3v2zm-3-7V3.5L18.5 9H13z" />
    </svg>
  );
};

export const HourglassTopIcon = () => {
  return (
    <svg className="icon-hourglass-top" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M6,2l0.01,6L10,12l-3.99,4.01L6,22h12v-6l-4-4l4-3.99V2H6z M16,16.5V20H8v-3.5l4-4L16,16.5z" />
    </svg>
  );
};

export const AssignmentTurnedInIcon = () => {
  return (
    <svg className="icon-assignment-turned-in" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
    </svg>
  );
};

export const ReviewsIcon = () => {
  return (
    <svg className="icon-reviews" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M8,11a1,1,0,1,0,1,1A1,1,0,0,0,8,11Zm4,0a1,1,0,1,0,1,1A1,1,0,0,0,12,11Zm4,0a1,1,0,1,0,1,1A1,1,0,0,0,16,11ZM12,2A10,10,0,0,0,2,12a9.89,9.89,0,0,0,2.26,6.33l-2,2a1,1,0,0,0-.21,1.09A1,1,0,0,0,3,22h9A10,10,0,0,0,12,2Zm0,18H5.41l.93-.93a1,1,0,0,0,.3-.71,1,1,0,0,0-.3-.7A8,8,0,1,1,12,20Z" />
    </svg>
  );
};

export const DeleteIcon = () => {
  return (
    <svg className="icon-delete" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  );
};

export const AdjustIcon = () => {
  return (
    <svg className="icon-adjust" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M5 15H3v4c0 1.1.9 2 2 2h4v-2H5v-4zM5 5h4V3H5c-1.1 0-2 .9-2 2v4h2V5zm7 3c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm7-11h-4v2h4v4h2V5c0-1.1-.9-2-2-2zm0 16h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4z" />
    </svg>
  );
};

export const InsightsIcon = () => {
  return (
    <svg className="icon-insights" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M21,8c-1.45,0-2.26,1.44-1.93,2.51l-3.55,3.56c-0.3-0.09-0.74-0.09-1.04,0l-2.55-2.55C12.27,10.45,11.46,9,10,9 c-1.45,0-2.27,1.44-1.93,2.52l-4.56,4.55C2.44,15.74,1,16.55,1,18c0,1.1,0.9,2,2,2c1.45,0,2.26-1.44,1.93-2.51l4.55-4.56 c0.3,0.09,0.74,0.09,1.04,0l2.55,2.55C12.73,16.55,13.54,18,15,18c1.45,0,2.27-1.44,1.93-2.52l3.56-3.55 C21.56,12.26,23,11.45,23,10C23,8.9,22.1,8,21,8z" />
      <polygon points="15,9 15.94,6.93 18,6 15.94,5.07 15,3 14.08,5.07 12,6 14.08,6.93" />
      <polygon points="3.5,11 4,9 6,8.5 4,8 3.5,6 3,8 1,8.5 3,9" />
    </svg>
  );
};

export const HappyFaceIcon = () => {
  return (
    <svg className="icon-happy-face" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
    </svg>
  );
};

export const SadFaceIcon = () => {
  return (
    <svg className="icon-sad-face" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <circle cx="15.5" cy="9.5" r="1.5" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-6c-2.33 0-4.32 1.45-5.12 3.5h1.67c.69-1.19 1.97-2 3.45-2s2.75.81 3.45 2h1.67c-.8-2.05-2.79-3.5-5.12-3.5z" />
    </svg>
  );
};

export const AngryFaceIcon = () => {
  return (
    <svg className="icon-angry-face" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M12 13.5c-2.33 0-4.31 1.46-5.11 3.5h10.22c-.8-2.04-2.78-3.5-5.11-3.5zM7.82 12l1.06-1.06L9.94 12 11 10.94 9.94 9.88 11 8.82 9.94 7.76 8.88 8.82 7.82 7.76 6.76 8.82l1.06 1.06-1.06 1.06zm4.17-10C6.47 2 2 6.47 2 12s4.47 10 9.99 10S22 17.53 22 12 17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm4.18-12.24l-1.06 1.06-1.06-1.06L13 8.82l1.06 1.06L13 10.94 14.06 12l1.06-1.06L16.18 12l1.06-1.06-1.06-1.06 1.06-1.06z" />
    </svg>
  );
};

export const ThumbUpIcon = () => {
  return (
    <svg className="icon-thumb-up" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M21 8h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2c0-1.1-.9-2-2-2zm0 4l-3 7H9V9l4.34-4.34L12.23 10H21v2zM1 9h4v12H1z" />
    </svg>
  );
};

export const ThumbDownIcon = () => {
  return (
    <svg className="icon-thumb-down" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.58-6.59c.37-.36.59-.86.59-1.41V5c0-1.1-.9-2-2-2zm0 12l-4.34 4.34L11.77 14H3v-2l3-7h9v10zm4-12h4v12h-4z" />
    </svg>
  );
};

export const ThumbUpDownIcon = () => {
  return (
    <svg className="icon-thumb-up-down" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M12 6c0-.55-.45-1-1-1H5.82l.66-3.18.02-.23c0-.31-.13-.59-.33-.8L5.38 0 .44 4.94C.17 5.21 0 5.59 0 6v6.5c0 .83.67 1.5 1.5 1.5h6.75c.62 0 1.15-.38 1.38-.91l2.26-5.29c.07-.17.11-.36.11-.55V6zm-2 1.13L7.92 12H2V6.21l1.93-1.93L3.36 7H10v.13zM22.5 10h-6.75c-.62 0-1.15.38-1.38.91l-2.26 5.29c-.07.17-.11.36-.11.55V18c0 .55.45 1 1 1h5.18l-.66 3.18-.02.24c0 .31.13.59.33.8l.79.78 4.94-4.94c.27-.27.44-.65.44-1.06v-6.5c0-.83-.67-1.5-1.5-1.5zm-.5 7.79l-1.93 1.93.57-2.72H14v-.13L16.08 12H22v5.79z" />
    </svg>
  );
};

export const LightBulbIcon = () => {
  return (
    <svg className="icon-light-bulb" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M9,21c0,0.55,0.45,1,1,1h4c0.55,0,1-0.45,1-1v-1H9V21z M12,2C8.14,2,5,5.14,5,9c0,2.38,1.19,4.47,3,5.74V17 c0,0.55,0.45,1,1,1h6c0.55,0,1-0.45,1-1v-2.26c1.81-1.27,3-3.36,3-5.74C19,5.14,15.86,2,12,2z M14,13.7V16h-4v-2.3 C8.48,12.63,7,11.53,7,9c0-2.76,2.24-5,5-5s5,2.24,5,5C17,11.49,15.49,12.65,14,13.7z" />
    </svg>
  );
};

export const StarIcon = () => {
  return (
    <svg className="icon-star" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z" />
    </svg>
  );
};

export const LockIcon = () => {
  return (
    <svg className="icon-lock" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M12,17c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S10.9,17,12,17z M18,8h-1V6c0-2.76-2.24-5-5-5S7,3.24,7,6v2H6 c-1.1,0-2,0.9-2,2v10c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V10C20,8.9,19.1,8,18,8z M8.9,6c0-1.71,1.39-3.1,3.1-3.1 s3.1,1.39,3.1,3.1v2H8.9V6z M18,20H6V10h12V20z" />
    </svg>
  );
};

export const BirthdayCakeIcon = () => {
  return (
    <svg className="icon-birthday-cake" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M12 6c1.11 0 2-.9 2-2 0-.38-.1-.73-.29-1.03L12 0l-1.71 2.97c-.19.3-.29.65-.29 1.03 0 1.1.9 2 2 2zm6 3h-5V7h-2v2H6c-1.66 0-3 1.34-3 3v9c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-9c0-1.66-1.34-3-3-3zm1 11H5v-3c.9-.01 1.76-.37 2.4-1.01l1.09-1.07 1.07 1.07c1.31 1.31 3.59 1.3 4.89 0l1.08-1.07 1.07 1.07c.64.64 1.5 1 2.4 1.01v3zm0-4.5c-.51-.01-.99-.2-1.35-.57l-2.13-2.13-2.14 2.13c-.74.74-2.03.74-2.77 0L8.48 12.8l-2.14 2.13c-.35.36-.83.56-1.34.57V12c0-.55.45-1 1-1h12c.55 0 1 .45 1 1v3.5z" />
    </svg>
  );
};

export const ConstructionIcon = () => {
  return (
    <svg className="icon-construction" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <rect height="8.48" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -6.8717 17.6255)" width="3" x="16.34" y="12.87" />
      <path d="M17.5,10c1.93,0,3.5-1.57,3.5-3.5c0-0.58-0.16-1.12-0.41-1.6l-2.7,2.7L16.4,6.11l2.7-2.7C18.62,3.16,18.08,3,17.5,3 C15.57,3,14,4.57,14,6.5c0,0.41,0.08,0.8,0.21,1.16l-1.85,1.85l-1.78-1.78l0.71-0.71L9.88,5.61L12,3.49 c-1.17-1.17-3.07-1.17-4.24,0L4.22,7.03l1.41,1.41H2.81L2.1,9.15l3.54,3.54l0.71-0.71V9.15l1.41,1.41l0.71-0.71l1.78,1.78 l-7.41,7.41l2.12,2.12L16.34,9.79C16.7,9.92,17.09,10,17.5,10z" />
    </svg>
  );
};

export const PlumbingIcon = () => {
  return (
    <svg className="icon-plumbing" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M19.28,4.93l-2.12-2.12c-0.78-0.78-2.05-0.78-2.83,0L11.5,5.64l2.12,2.12l2.12-2.12l3.54,3.54 C20.45,8,20.45,6.1,19.28,4.93z" />
      <path d="M5.49,13.77c0.59,0.59,1.54,0.59,2.12,0l2.47-2.47L7.96,9.17l-2.47,2.47C4.9,12.23,4.9,13.18,5.49,13.77L5.49,13.77z" />
      <path d="M15.04,7.76l-0.71,0.71l-0.71,0.71l-3.18-3.18C9.85,5.4,8.9,5.4,8.32,5.99c-0.59,0.59-0.59,1.54,0,2.12l3.18,3.18 L10.79,12l-6.36,6.36c-0.78,0.78-0.78,2.05,0,2.83c0.78,0.78,2.05,0.78,2.83,0L16.45,12c0.39,0.39,1.02,0.39,1.41,0 c0.39-0.39,0.39-1.02,0-1.41L15.04,7.76z" />
    </svg>
  );
};

export const ExploreIcon = () => {
  return (
    <svg className="icon-explore" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1.41 2L5 17.59V5h12.59zM6.41 19L19 6.41V19H6.41zM6 7h5v1.5H6zm10 5.5h-1.5v2h-2V16h2v2H16v-2h2v-1.5h-2z" />
    </svg>
  );
};

export const ForumIcon = () => {
  return (
    <svg className="icon-forum" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M15 4v7H5.17L4 12.17V4h11m1-2H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm5 4h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1z" />
    </svg>
  );
};

export const CheckCircleIcon = () => {
  return (
    <svg className="icon-check-circle" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M16.59 7.58L10 14.17l-3.59-3.58L5 12l5 5 8-8zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
    </svg>
  );
};

export const ArrowCircleDownIcon = () => {
  return (
    <svg className="icon-arrow-circle-down" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M12,4c4.41,0,8,3.59,8,8s-3.59,8-8,8s-8-3.59-8-8S7.59,4,12,4 M12,2C6.48,2,2,6.48,2,12c0,5.52,4.48,10,10,10 c5.52,0,10-4.48,10-10C22,6.48,17.52,2,12,2L12,2z M13,12l0-4h-2l0,4H8l4,4l4-4H13z" />
    </svg>
  );
};

export const ArrowCircleUpIcon = () => {
  return (
    <svg className="icon-arrow-circle-up" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8s8,3.59,8,8S16.41,20,12,20 M12,22c5.52,0,10-4.48,10-10c0-5.52-4.48-10-10-10 C6.48,2,2,6.48,2,12C2,17.52,6.48,22,12,22L12,22z M11,12l0,4h2l0-4h3l-4-4l-4,4H11z" />
    </svg>
  );
};

export const RocketLaunchIcon = () => {
  return (
    <svg className="icon-rocket-launch" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M6,15c-0.83,0-1.58,0.34-2.12,0.88C2.7,17.06,2,22,2,22s4.94-0.7,6.12-1.88C8.66,19.58,9,18.83,9,18C9,16.34,7.66,15,6,15 z M6.71,18.71c-0.28,0.28-2.17,0.76-2.17,0.76s0.47-1.88,0.76-2.17C5.47,17.11,5.72,17,6,17c0.55,0,1,0.45,1,1 C7,18.28,6.89,18.53,6.71,18.71z M17.42,13.65L17.42,13.65c6.36-6.36,4.24-11.31,4.24-11.31s-4.95-2.12-11.31,4.24l-2.49-0.5 C7.21,5.95,6.53,6.16,6.05,6.63L2,10.69l5,2.14L11.17,17l2.14,5l4.05-4.05c0.47-0.47,0.68-1.15,0.55-1.81L17.42,13.65z M7.41,10.83L5.5,10.01l1.97-1.97l1.44,0.29C8.34,9.16,7.83,10.03,7.41,10.83z M13.99,18.5l-0.82-1.91 c0.8-0.42,1.67-0.93,2.49-1.5l0.29,1.44L13.99,18.5z M16,12.24c-1.32,1.32-3.38,2.4-4.04,2.73l-2.93-2.93 c0.32-0.65,1.4-2.71,2.73-4.04c4.68-4.68,8.23-3.99,8.23-3.99S20.68,7.56,16,12.24z M15,11c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2 S13.9,11,15,11z" />
    </svg>
  );
};

export const SupportIcon = () => {
  return (
    <svg className="icon-support" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M12,2C6.48,2,2,6.48,2,12c0,5.52,4.48,10,10,10s10-4.48,10-10C22,6.48,17.52,2,12,2z M19.46,9.12l-2.78,1.15 c-0.51-1.36-1.58-2.44-2.95-2.94l1.15-2.78C16.98,5.35,18.65,7.02,19.46,9.12z M12,15c-1.66,0-3-1.34-3-3s1.34-3,3-3s3,1.34,3,3 S13.66,15,12,15z M9.13,4.54l1.17,2.78c-1.38,0.5-2.47,1.59-2.98,2.97L4.54,9.13C5.35,7.02,7.02,5.35,9.13,4.54z M4.54,14.87 l2.78-1.15c0.51,1.38,1.59,2.46,2.97,2.96l-1.17,2.78C7.02,18.65,5.35,16.98,4.54,14.87z M14.88,19.46l-1.15-2.78 c1.37-0.51,2.45-1.59,2.95-2.97l2.78,1.17C18.65,16.98,16.98,18.65,14.88,19.46z" />
    </svg>
  );
};

export const AnchorIcon = () => {
  return (
    <svg className="icon-anchor" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M17,15l1.55,1.55c-0.96,1.69-3.33,3.04-5.55,3.37V11h3V9h-3V7.82C14.16,7.4,15,6.3,15,5c0-1.65-1.35-3-3-3S9,3.35,9,5 c0,1.3,0.84,2.4,2,2.82V9H8v2h3v8.92c-2.22-0.33-4.59-1.68-5.55-3.37L7,15l-4-3v3c0,3.88,4.92,7,9,7s9-3.12,9-7v-3L17,15z M12,4 c0.55,0,1,0.45,1,1s-0.45,1-1,1s-1-0.45-1-1S11.45,4,12,4z" />
    </svg>
  );
};

export const ChevronLeftIcon = () => {
  return (
    <svg className="icon-chevron-left" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </svg>
  );
};

export const ChevronDownIcon = () => {
  return (
    <svg className="icon-chevron-down" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z" />
    </svg>
  );
};

export const ChevronUpIcon = () => {
  return (
    <svg className="icon-chevron-up" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14l-6-6z" />
    </svg>
  );
};

export const ChevronRightIcon = () => {
  return (
    <svg className="icon-chevron-right" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
    </svg>
  );
};

export const SearchIcon = () => {
  return (
    <svg className="icon-search" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
  );
};

export const ElectricBoltIcon = () => {
  return (
    <svg className="icon-electric-bolt" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M14.69,2.21L4.33,11.49c-0.64,0.58-0.28,1.65,0.58,1.73L13,14l-4.85,6.76c-0.22,0.31-0.19,0.74,0.08,1.01h0 c0.3,0.3,0.77,0.31,1.08,0.02l10.36-9.28c0.64-0.58,0.28-1.65-0.58-1.73L11,10l4.85-6.76c0.22-0.31,0.19-0.74-0.08-1.01l0,0 C15.47,1.93,15,1.92,14.69,2.21z" />
    </svg>
  );
};

export const PsychologicalSafetyIcon = () => {
  return (
    <svg className="icon-psychological-safety" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M19.94,9.06C19.5,5.73,16.57,3,13,3C9.47,3,6.57,5.61,6.08,9l-1.93,3.48C3.74,13.14,4.22,14,5,14h1l0,2c0,1.1,0.9,2,2,2h1 v3h7l0-4.68C18.62,15.07,20.35,12.24,19.94,9.06z M14.89,14.63L14,15.05V19h-3v-3H8v-4H6.7l1.33-2.33C8.21,7.06,10.35,5,13,5 c2.76,0,5,2.24,5,5C18,12.09,16.71,13.88,14.89,14.63z" />
      <path d="M12.5,12.54c-0.41,0-0.74,0.31-0.74,0.73c0,0.41,0.33,0.74,0.74,0.74c0.42,0,0.73-0.33,0.73-0.74 C13.23,12.85,12.92,12.54,12.5,12.54z" />
      <path d="M12.5,7c-1.03,0-1.74,0.67-2,1.45l0.96,0.4c0.13-0.39,0.43-0.86,1.05-0.86c0.95,0,1.13,0.89,0.8,1.36 c-0.32,0.45-0.86,0.75-1.14,1.26c-0.23,0.4-0.18,0.87-0.18,1.16h1.06c0-0.55,0.04-0.65,0.13-0.82c0.23-0.42,0.65-0.62,1.09-1.27 c0.4-0.59,0.25-1.38-0.01-1.8C13.95,7.39,13.36,7,12.5,7z" />
    </svg>
  );
};

export const BalanceIcon = () => {
  return (
    <svg className="icon-balance" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M13,7.83c0.85-0.3,1.53-0.98,1.83-1.83H18l-3,7c0,1.66,1.57,3,3.5,3s3.5-1.34,3.5-3l-3-7h2V4h-6.17 C14.42,2.83,13.31,2,12,2S9.58,2.83,9.17,4L3,4v2h2l-3,7c0,1.66,1.57,3,3.5,3S9,14.66,9,13L6,6h3.17c0.3,0.85,0.98,1.53,1.83,1.83 V19H2v2h20v-2h-9V7.83z M20.37,13h-3.74l1.87-4.36L20.37,13z M7.37,13H3.63L5.5,8.64L7.37,13z M12,6c-0.55,0-1-0.45-1-1 c0-0.55,0.45-1,1-1s1,0.45,1,1C13,5.55,12.55,6,12,6z" />
    </svg>
  );
};

export const GearIcon = () => {
  return (
    <svg className="icon-gear" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1q-.09-.03-.18-.03c-.17 0-.34.09-.43.25l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.09.16.26.25.44.25.06 0 .12-.01.17-.03l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1q.09.03.18.03c.17 0 .34-.09.43-.25l2-3.46c.12-.22.07-.49-.12-.64zm-1.98-1.71c.04.31.05.52.05.73s-.02.43-.05.73l-.14 1.13.89.7 1.08.84-.7 1.21-1.27-.51-1.04-.42-.9.68c-.43.32-.84.56-1.25.73l-1.06.43-.16 1.13-.2 1.35h-1.4l-.19-1.35-.16-1.13-1.06-.43c-.43-.18-.83-.41-1.23-.71l-.91-.7-1.06.43-1.27.51-.7-1.21 1.08-.84.89-.7-.14-1.13c-.03-.31-.05-.54-.05-.74s.02-.43.05-.73l.14-1.13-.89-.7-1.08-.84.7-1.21 1.27.51 1.04.42.9-.68c.43-.32.84-.56 1.25-.73l1.06-.43.16-1.13.2-1.35h1.39l.19 1.35.16 1.13 1.06.43c.43.18.83.41 1.23.71l.91.7 1.06-.43 1.27-.51.7 1.21-1.07.85-.89.7zM12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4m0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2" />
    </svg>
  );
};

export const GearWithStarsIcon = () => {
  return (
    <svg className="icon-gear-with-stars" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M10 13c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1m0-2c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3m8.5-2 1.09-2.41L22 5.5l-2.41-1.09L18.5 2l-1.09 2.41L15 5.5l2.41 1.09zm2.78 3.72L20.5 11l-.78 1.72-1.72.78 1.72.78.78 1.72.78-1.72L23 13.5zM16.25 14c0-.12 0-.25-.01-.37l1.94-1.47-2.5-4.33-2.24.94c-.2-.13-.42-.26-.64-.37L12.5 6h-5l-.3 2.41c-.22.11-.43.24-.64.37l-2.24-.95-2.5 4.33 1.94 1.47c-.01.12-.01.25-.01.37s0 .25.01.37l-1.94 1.47 2.5 4.33 2.24-.94c.2.13.42.26.64.37l.3 2.4h5l.3-2.41c.22-.11.43-.23.64-.37l2.24.94 2.5-4.33-1.94-1.47c.01-.11.01-.24.01-.36m-1.42 3.64-1.73-.73c-.56.6-1.3 1.04-2.13 1.23L10.73 20H9.27l-.23-1.86c-.83-.19-1.57-.63-2.13-1.23l-1.73.73-.73-1.27 1.49-1.13q-.18-.585-.18-1.23t.18-1.23l-1.49-1.13.73-1.27 1.73.73c.56-.6 1.3-1.04 2.13-1.23L9.27 8h1.47l.23 1.86c.83.19 1.57.63 2.13 1.23l1.73-.73.73 1.27-1.49 1.13q.18.585.18 1.23t-.18 1.23l1.49 1.13z" />
    </svg>
  );
};

export const ListAllIcon = () => {
  return (
    <svg className="icon-list-all" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
      <path d="M7 8h2v2H7V8z" />
      <path d="M7 12h2v2H7V12z" />
      <path d="M7 16h2v2H7V16z" />
      <path d="M11 8h6v2h-6V8z" />
      <path d="M11 12h6v2h-6V12z" />
      <path d="M11 16h6v2h-6V16z" />
    </svg>
  );
};

export const LinkOffIcon = () => {
  return (
    <svg className="icon-link-off" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M17 7h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1 0 1.43-.98 2.63-2.31 2.98l1.46 1.46C20.88 15.61 22 13.95 22 12c0-2.76-2.24-5-5-5zm-1 4h-2.19l2 2H16zM2 4.27l3.11 3.11C3.29 8.12 2 9.91 2 12c0 2.76 2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1 0-1.59 1.21-2.9 2.76-3.07L8.73 11H8v2h2.73L13 15.27V17h1.73l4.01 4L20 19.74 3.27 3 2 4.27z" />
    </svg>
  );
};

export const TableChartIcon = () => {
  return (
    <svg className="icon-table-chart" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M20 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 2v3H5V5h15zm-5 14h-5v-9h5v9zM5 10h3v9H5v-9zm12 9v-9h3v9h-3z" />
    </svg>
  );
};

export const SpeedIcon = () => {
  return (
    <svg className="icon-speed" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z" />
    </svg>
  );
};

export const MoreVerticalIcon = () => {
  return (
    <svg className="icon-more-vertical" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  );
};

export const GroupWorkIcon = () => {
  return (
    <svg className="icon-group-work" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
      <circle cx="8" cy="14" r="2" />
      <circle cx="12" cy="8" r="2" />
      <circle cx="16" cy="14" r="2" />
    </svg>
  );
};

export const UndoIcon = () => {
  return (
    <svg className="icon-undo" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />
    </svg>
  );
};

export const LogoutIcon = () => {
  return (
    <svg className="icon-logout" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M17,8l-1.41,1.41L17.17,11H9v2h8.17l-1.58,1.58L17,16l4-4L17,8z M5,5h7V3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h7v-2H5V5z" />
    </svg>
  );
};

export const ViewColumnIcon = () => {
  return (
    <svg className="icon-view-column" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M3 5v14h18V5zm5.33 12H5V7h3.33zm5.34 0h-3.33V7h3.33zM19 17h-3.33V7H19z" />
    </svg>
  );
};

export interface IIconDefinition {
  id: string;
  name: string;
  icon: React.ReactElement;
  trayOrder: number;
  legacyAliases?: string[];
}

export const iconDefinitions: IIconDefinition[] = [
  { id: "happy-face", name: "Smile", icon: <HappyFaceIcon />, trayOrder: 1, legacyAliases: ["fas fa-cart-plus", "far fa-smile"] },
  { id: "sad-face", name: "Frown", icon: <SadFaceIcon />, trayOrder: 2, legacyAliases: ["far fa-frown"] },
  { id: "add-circle", name: "Add Circle", icon: <AddCircleIcon />, trayOrder: 3, legacyAliases: ["fa-plus", "fa-plus-circle", "far fa-square-plus"] },
  { id: "check-circle", name: "Check", icon: <CheckCircleIcon />, trayOrder: 4, legacyAliases: ["fa-check-circle", "far fa-square-check"] },
  { id: "help", name: "Question", icon: <HelpIcon />, trayOrder: 5, legacyAliases: ["fas fa-question", "far fa-question"] },
  { id: "exclamation", name: "Exclamation", icon: <ExclamationIcon />, trayOrder: 6, legacyAliases: ["fas fa-exclamation", "fas fa-exclamation-triangle", "far fa-exclamation"] },
  { id: "thumb-up", name: "Thumb Up", icon: <ThumbUpIcon />, trayOrder: 7, legacyAliases: ["far fa-thumbs-up"] },
  { id: "thumb-down", name: "Thumb Down", icon: <ThumbDownIcon />, trayOrder: 8, legacyAliases: ["fas fa-skull-crossbones", "far fa-thumbs-down"] },
  { id: "reviews", name: "Reviews", icon: <ReviewsIcon />, trayOrder: 9 },
  { id: "forum", name: "Forum", icon: <ForumIcon />, trayOrder: 10, legacyAliases: ["far fa-comments"] },
  { id: "star", name: "Star", icon: <StarIcon />, trayOrder: 11, legacyAliases: ["far fa-star", "fas fa-star"] },
  { id: "light-bulb", name: "Light Bulb", icon: <LightBulbIcon />, trayOrder: 12, legacyAliases: ["far fa-lightbulb"] },
  { id: "coffee", name: "Coffee", icon: <CoffeeIcon />, trayOrder: 13, legacyAliases: ["fas fa-coffee"] },
  { id: "birthday-cake", name: "Birthday Cake", icon: <BirthdayCakeIcon />, trayOrder: 14, legacyAliases: ["fas fa-birthday-cake"] },
  { id: "play-circle", name: "Play", icon: <PlayCircleIcon />, trayOrder: 15, legacyAliases: ["far fa-circle-play"] },
  { id: "stop-circle", name: "Stop", icon: <StopCircleIcon />, trayOrder: 16, legacyAliases: ["far fa-circle-stop"] },
  { id: "adjust", name: "Target", icon: <AdjustIcon />, trayOrder: 17, legacyAliases: ["far fa-circle-dot", "fa-bullseye"] },
  { id: "eye", name: "Eye", icon: <EyeIcon />, trayOrder: 18, legacyAliases: ["eye", "far fa-eye"] },
  { id: "menu-book", name: "Book", icon: <MenuBookIcon />, trayOrder: 19, legacyAliases: ["fas fa-book"] },
  { id: "rocket-launch", name: "Rocket", icon: <RocketLaunchIcon />, trayOrder: 20, legacyAliases: ["fas fa-rocket", "fas fa-fan"] },
  { id: "plumbing", name: "Plumbing", icon: <PlumbingIcon />, trayOrder: 21, legacyAliases: ["far fa-plumbing", "far fa-wrench", "fas fa-wrench"] },
  { id: "construction", name: "Construction", icon: <ConstructionIcon />, trayOrder: 22, legacyAliases: ["fas fa-chalkboard", "fas fa-construction"] },
  { id: "anchor", name: "Anchor", icon: <AnchorIcon />, trayOrder: 23, legacyAliases: ["fas fa-anchor"] },
  { id: "support", name: "Support", icon: <SupportIcon />, trayOrder: 24, legacyAliases: ["fas fa-life-ring"] },
  { id: "search", name: "Search", icon: <SearchIcon />, trayOrder: 25, legacyAliases: ["search", "fa-solid fa-magnifying-glass"] },
  { id: "electric-bolt", name: "Electric Bolt", icon: <ElectricBoltIcon />, trayOrder: 26, legacyAliases: ["electric-bolt", "fa-solid fa-bolt"] },
  { id: "lock", name: "Lock", icon: <LockIcon />, trayOrder: 27, legacyAliases: ["fas fa-lock"] },
  { id: "balance", name: "Balance", icon: <BalanceIcon />, trayOrder: 28, legacyAliases: ["balance", "fas fa-scale-balanced", "fas fa-scale-unbalanced", "fas fa-scale-unbalanced-flip", "fa-solid fa-scale-balanced"] },
  { id: "gear", name: "Gear", icon: <GearIcon />, trayOrder: 29, legacyAliases: ["gear"] },
  { id: "speed", name: "Speed", icon: <SpeedIcon />, trayOrder: 30, legacyAliases: ["fa-solid fa-square-poll-vertical"] },
  { id: "angry-face", name: "Angry", icon: <AngryFaceIcon />, trayOrder: 0, legacyAliases: ["far fa-angry"] },
  { id: "thumb-up-down", name: "Thumb Up/Down", icon: <ThumbUpDownIcon />, trayOrder: 0, legacyAliases: ["far fa-thumbs-up-down"] },
  { id: "explore", name: "Explore", icon: <ExploreIcon />, trayOrder: 0, legacyAliases: ["far fa-compass"] },
  { id: "delete", name: "Delete", icon: <DeleteIcon />, trayOrder: 0, legacyAliases: ["fas fa-trash"] },
  { id: "psychological-safety", name: "Psychological Safety", icon: <PsychologicalSafetyIcon />, trayOrder: 0, legacyAliases: ["psychological-safety", "fa-regular fa-handshake"] },
  { id: "gear-with-stars", name: "Gear With Stars", icon: <GearWithStarsIcon />, trayOrder: 0, legacyAliases: ["gears", "gear-with-stars", "fa-solid fa-gears"] },
  { id: "list-all", name: "List All", icon: <ListAllIcon />, trayOrder: 0 },
  { id: "view-column", name: "View Column", icon: <ViewColumnIcon />, trayOrder: 0 },
  { id: "add", name: "Add", icon: <AddIcon />, trayOrder: 0 },
  { id: "edit", name: "Edit", icon: <EditIcon />, trayOrder: 0 },
  { id: "link", name: "Link", icon: <LinkIcon />, trayOrder: 0 },
  { id: "sms", name: "SMS", icon: <SMSIcon />, trayOrder: 0 },
  { id: "note-add", name: "Note Add", icon: <NoteAddIcon />, trayOrder: 0 },
  { id: "hourglass-top", name: "Hourglass Top", icon: <HourglassTopIcon />, trayOrder: 0 },
  { id: "assignment-turned-in", name: "Assignment Turned In", icon: <AssignmentTurnedInIcon />, trayOrder: 0 },
  { id: "close", name: "Close", icon: <CloseIcon />, trayOrder: 0 },
  { id: "celebration", name: "Celebration", icon: <CelebrationIcon />, trayOrder: 0 },
  { id: "cloud", name: "Cloud", icon: <CloudIcon />, trayOrder: 0 },
  { id: "cloud-upload", name: "Cloud Upload", icon: <CloudUploadIcon />, trayOrder: 0 },
  { id: "cloud-download", name: "Cloud Download", icon: <CloudDownloadIcon />, trayOrder: 0 },
  { id: "arrow-circle-down", name: "Arrow Circle Down", icon: <ArrowCircleDownIcon />, trayOrder: 0 },
  { id: "arrow-circle-up", name: "Arrow Circle Up", icon: <ArrowCircleUpIcon />, trayOrder: 0 },
  { id: "person", name: "Person", icon: <PersonIcon />, trayOrder: 0 },
  { id: "people", name: "People", icon: <PeopleIcon />, trayOrder: 0 },
  { id: "insights", name: "Insights", icon: <InsightsIcon />, trayOrder: 0 },
  { id: "assessment", name: "Assessment", icon: <AssessmentIcon />, trayOrder: 0 },
  { id: "chevron-up", name: "Chevron Up", icon: <ChevronUpIcon />, trayOrder: 0 },
  { id: "chevron-down", name: "Chevron Down", icon: <ChevronDownIcon />, trayOrder: 0 },
  { id: "chevron-left", name: "Chevron Left", icon: <ChevronLeftIcon />, trayOrder: 0 },
  { id: "chevron-right", name: "Chevron Right", icon: <ChevronRightIcon />, trayOrder: 0 },
  { id: "privacy-tip", name: "Privacy Tip", icon: <PrivacyTipIcon />, trayOrder: 0 },
  { id: "keyboard", name: "Keyboard", icon: <KeyboardIcon />, trayOrder: 0 },
  { id: "volunteer-activism", name: "Volunteer Activism", icon: <VolunteerActivismIcon />, trayOrder: 0 },
  { id: "contact-phone", name: "Contact Phone", icon: <ContactPhoneIcon />, trayOrder: 0 },
  { id: "pause-circle", name: "Pause Circle", icon: <PauseCircleIcon />, trayOrder: 0 },
  { id: "refresh", name: "Refresh", icon: <RefreshIcon />, trayOrder: 0 },
  { id: "link-off", name: "Link Off", icon: <LinkOffIcon />, trayOrder: 0 },
  { id: "table-chart", name: "Table Chart", icon: <TableChartIcon />, trayOrder: 0 },
  { id: "info", name: "Info", icon: <InfoIcon />, trayOrder: 0 },
  { id: "content-copy", name: "Content Copy", icon: <ContentCopyIcon />, trayOrder: 0 },
  { id: "sim-card-download", name: "Sim Card Download", icon: <SimCardDownloadIcon />, trayOrder: 0 },
  { id: "forward-to-inbox", name: "Forward To Inbox", icon: <ForwardToInboxIcon />, trayOrder: 0 },
  { id: "source", name: "Source", icon: <SourceIcon />, trayOrder: 0 },
  { id: "inventory", name: "Inventory", icon: <InventoryIcon />, trayOrder: 0 },
  { id: "more-horizontal", name: "More Horizontal", icon: <MoreHorizontalIcon />, trayOrder: 0 },
  { id: "more-vertical", name: "More Vertical", icon: <MoreVerticalIcon />, trayOrder: 0 },
  { id: "report", name: "Report", icon: <ReportIcon />, trayOrder: 0 },
  { id: "report-problem", name: "Report Problem", icon: <ReportProblemIcon />, trayOrder: 0 },
  { id: "open-with", name: "Open With", icon: <OpenWithIcon />, trayOrder: 0 },
  { id: "group-work", name: "Group Work", icon: <GroupWorkIcon />, trayOrder: 0 },
  { id: "undo", name: "Undo", icon: <UndoIcon />, trayOrder: 0 },
  { id: "logout", name: "Logout", icon: <LogoutIcon />, trayOrder: 0 },
  { id: "add", name: "Add", icon: <AddIcon />, trayOrder: 0 },
  { id: "edit", name: "Edit", icon: <EditIcon />, trayOrder: 0 },
  { id: "link", name: "Link", icon: <LinkIcon />, trayOrder: 0 },
  { id: "sms", name: "SMS", icon: <SMSIcon />, trayOrder: 0 },
  { id: "note-add", name: "Note Add", icon: <NoteAddIcon />, trayOrder: 0 },
  { id: "hourglass-top", name: "Hourglass Top", icon: <HourglassTopIcon />, trayOrder: 0 },
  { id: "assignment-turned-in", name: "Assignment Turned In", icon: <AssignmentTurnedInIcon />, trayOrder: 0 },
  { id: "close", name: "Close", icon: <CloseIcon />, trayOrder: 0 },
  { id: "celebration", name: "Celebration", icon: <CelebrationIcon />, trayOrder: 0 },
  { id: "cloud", name: "Cloud", icon: <CloudIcon />, trayOrder: 0 },
  { id: "cloud-upload", name: "Cloud Upload", icon: <CloudUploadIcon />, trayOrder: 0 },
  { id: "cloud-download", name: "Cloud Download", icon: <CloudDownloadIcon />, trayOrder: 0 },
  { id: "arrow-circle-down", name: "Arrow Circle Down", icon: <ArrowCircleDownIcon />, trayOrder: 0 },
  { id: "arrow-circle-up", name: "Arrow Circle Up", icon: <ArrowCircleUpIcon />, trayOrder: 0 },
  { id: "person", name: "Person", icon: <PersonIcon />, trayOrder: 0 },
  { id: "people", name: "People", icon: <PeopleIcon />, trayOrder: 0 },
  { id: "insights", name: "Insights", icon: <InsightsIcon />, trayOrder: 0 },
  { id: "assessment", name: "Assessment", icon: <AssessmentIcon />, trayOrder: 0 },
  { id: "chevron-up", name: "Chevron Up", icon: <ChevronUpIcon />, trayOrder: 0 },
  { id: "chevron-down", name: "Chevron Down", icon: <ChevronDownIcon />, trayOrder: 0 },
  { id: "chevron-left", name: "Chevron Left", icon: <ChevronLeftIcon />, trayOrder: 0 },
  { id: "chevron-right", name: "Chevron Right", icon: <ChevronRightIcon />, trayOrder: 0 },
  { id: "privacy-tip", name: "Privacy Tip", icon: <PrivacyTipIcon />, trayOrder: 0 },
  { id: "keyboard", name: "Keyboard", icon: <KeyboardIcon />, trayOrder: 0 },
  { id: "volunteer-activism", name: "Volunteer Activism", icon: <VolunteerActivismIcon />, trayOrder: 0 },
  { id: "contact-phone", name: "Contact Phone", icon: <ContactPhoneIcon />, trayOrder: 0 },
  { id: "pause-circle", name: "Pause Circle", icon: <PauseCircleIcon />, trayOrder: 0 },
  { id: "refresh", name: "Refresh", icon: <RefreshIcon />, trayOrder: 0 },
  { id: "link-off", name: "Link Off", icon: <LinkOffIcon />, trayOrder: 0 },
  { id: "table-chart", name: "Table Chart", icon: <TableChartIcon />, trayOrder: 0 },
  { id: "info", name: "Info", icon: <InfoIcon />, trayOrder: 0 },
  { id: "content-copy", name: "Content Copy", icon: <ContentCopyIcon />, trayOrder: 0 },
  { id: "sim-card-download", name: "Sim Card Download", icon: <SimCardDownloadIcon />, trayOrder: 0 },
  { id: "forward-to-inbox", name: "Forward To Inbox", icon: <ForwardToInboxIcon />, trayOrder: 0 },
  { id: "source", name: "Source", icon: <SourceIcon />, trayOrder: 0 },
  { id: "inventory", name: "Inventory", icon: <InventoryIcon />, trayOrder: 0 },
  { id: "more-horizontal", name: "More Horizontal", icon: <MoreHorizontalIcon />, trayOrder: 0 },
  { id: "more-vertical", name: "More Vertical", icon: <MoreVerticalIcon />, trayOrder: 0 },
  { id: "report", name: "Report", icon: <ReportIcon />, trayOrder: 0 },
  { id: "report-problem", name: "Report Problem", icon: <ReportProblemIcon />, trayOrder: 0 },
  { id: "open-with", name: "Open With", icon: <OpenWithIcon />, trayOrder: 0 },
  { id: "group-work", name: "Group Work", icon: <GroupWorkIcon />, trayOrder: 0 },
  { id: "undo", name: "Undo", icon: <UndoIcon />, trayOrder: 0 },
  { id: "logout", name: "Logout", icon: <LogoutIcon />, trayOrder: 0 },
];

const iconDefinitionById = new Map(iconDefinitions.map(icon => [icon.id, icon]));
export const selectionTrayIcons = iconDefinitions.filter(icon => icon.trayOrder > 0).sort((left, right) => left.trayOrder - right.trayOrder);

export const availableIcons = selectionTrayIcons;

export interface ILegacyIconMapping {
  legacyId: string;
  iconId: string;
}

export const legacyIconMappings: ILegacyIconMapping[] = iconDefinitions.flatMap(icon =>
  (icon.legacyAliases ?? []).map(legacyId => ({ legacyId, iconId: icon.id })),
);

const legacyIconIdByTag = new Map(legacyIconMappings.map(mapping => [mapping.legacyId, mapping.iconId]));

export function getIconElement(iconId: string | undefined | null): React.ReactElement {
  const resolvedIconId = iconId ? legacyIconIdByTag.get(iconId) ?? iconId : undefined;
  const foundIcon = resolvedIconId ? iconDefinitionById.get(resolvedIconId) : undefined;

  if (!foundIcon) {
    return <img className="icon-retrospective-logo" src={retrospectiveLogoUrl} width="24" height="24" alt="" aria-hidden="true" />;
  }

  return foundIcon.icon;
}

export const fluentUiIcons = {
  Delete: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048">
      <path d="M1792 384h-128v1472q0 40-15 75t-41 61-61 41-75 15H576q-40 0-75-15t-61-41-41-61-15-75V384H256V256h512V128q0-27 10-50t27-40 41-28 50-10h256q27 0 50 10t40 27 28 41 10 50v128h512v128zM768 256h512V128H768v128zm768 128H512v1472q0 26 19 45t45 19h896q26 0 45-19t19-45V384zM768 1664H640V640h128v1024zm256 0H896V640h128v1024zm256 0h-128V640h128v1024z" />
    </svg>
  ),
  Move: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048">
      <path d="M2048 1024l-320 320-90-90 165-166h-523v523l166-165 90 90-320 320-320-320 90-90 166 165v-523H640v523l165-165 90 90-320 320-320-320 90-90 166 165v-523H0V896h511L346 731l90-90 320 320-320 320-90-90 165-166H0V896h511l-165-165 90-90 320 320-320 320-90-90 166-165v523H640V1024h523l-165-165 90-90 320 320z" />
    </svg>
  ),
  RowsGroup: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048">
      <path d="M128 128h1792v1792H128V128zm1664 1664V640H256v1152h1536zM256 512h1536V256H256v256zm128 384h1280v128H384V896zm0 256h1280v128H384v-128zm0 256h1280v128H384v-128z" />
    </svg>
  ),
  Remove: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048">
      <path d="M1115 1024l690 691-90 90-691-690-691 690-90-90 690-691-690-691 90-90 691 690 691-690 90 90-690 691z" />
    </svg>
  ),
  MoreVertical: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048">
      <path d="M1024 640q-53 0-99-20t-82-55-55-81-20-100q0-53 20-99t55-82 81-55 100-20q53 0 99 20t82 55 55 81 20 100q0 53-20 99t-55 82-81 55-100 20zm0 512q-53 0-99-20t-82-55-55-81-20-100q0-53 20-99t55-82 81-55 100-20q53 0 99 20t82 55 55 81 20 100q0 53-20 99t-55 82-81 55-100 20zm0 512q-53 0-99-20t-82-55-55-81-20-100q0-53 20-99t55-82 81-55 100-20q53 0 99 20t82 55 55 81 20 100q0 53-20 99t-55 82-81 55-100 20z" />
    </svg>
  ),
  Up: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048">
      <path d="M1024 0l1024 1024-146 146-878-878-878 878L0 1024 1024 0z" />
    </svg>
  ),
  Down: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048">
      <path d="M0 1024l1024 1024 1024-1024-146-146-878 878-878-878L0 1024z" />
    </svg>
  ),
  Undo: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048">
      <path d="M1536 640q133 0 249 50t204 137 137 203 50 250q0 133-50 249t-137 204-203 137-250 50h-384v-128h384q106 0 199-40t163-109 110-163 40-200q0-106-40-199t-109-163-163-110-200-40H452l402 403-90 90L128 626 764 0l90 90-403 403h1085v147z" />
    </svg>
  ),
};
