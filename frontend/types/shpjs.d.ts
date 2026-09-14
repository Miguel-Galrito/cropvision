declare module 'shpjs' {
  const shp: (buffer: ArrayBuffer | string) => Promise<any>;
  export default shp;
}
