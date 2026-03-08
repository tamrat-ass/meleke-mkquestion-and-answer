declare module 'bcryptjs' {
  function genSalt(rounds?: number): Promise<string>;
  function hash(s: string, salt: number | string): Promise<string>;
  function compare(s: string, hash: string): Promise<boolean>;
  export default { genSalt, hash, compare };
}
