import '@testing-library/jest-dom'

if (typeof window !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
      :root {
        --accent: blue;
        --background-main: white;
        --border-main: #E5E7EB;
        --text-secondary: #6B7280;
      }
    `;
    document.head.appendChild(style);
} 