declare module '*.svg' {
  const content: any;
  export default content;
}
declare module '*.png' {
  const content: any;
  export default content;
}
declare module '*.jpg' {
  const content: any;
  export default content;
}
declare module '*.jpeg' {
  const content: any;
  export default content;
}
declare module 'gibberish-dsp/dist/gibberish_worklet.js' {
  const url: string;
  export default url;
}

interface Window {
  Gibberish: any;
}
