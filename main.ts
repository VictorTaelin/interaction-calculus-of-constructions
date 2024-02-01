#!/usr/bin/env ts-node

// ICC: Parser, Stringifier and CLI
// ================================

// List
// ----

type List<A> =
  | { tag: "Cons"; head: A; tail: List<A> }
  | { tag: "Nil"; };

// Constructors
const Cons = <A>(head: A, tail: List<A>): List<A> => ({ tag: "Cons", head, tail });
const Nil  = <A>(): List<A>                       => ({ tag: "Nil" });

// Term
// ----

type Term =
  | { $: "Lam"; bod: (x:Term)=> Term }
  | { $: "App"; fun: Term; arg: Term }
  | { $: "Bri"; bod: (x:Term)=> Term }
  | { $: "Ann"; val: Term; typ: Term }
  | { $: "Var"; nam: number }
  | { $: "Ref"; nam: string };

// Constructors
export const Lam = (bod: (x:Term)=> Term): Term => ({ $: "Lam", bod });
export const App = (fun: Term, arg: Term): Term => ({ $: "App", fun, arg });
export const Bri = (bod: (x:Term)=> Term): Term => ({ $: "Bri", bod });
export const Ann = (val: Term, typ: Term): Term => ({ $: "Ann", val, typ });
export const Var = (nam: number): Term => ({ $: "Var", nam });
export const Ref = (nam: string): Term => ({ $: "Ref", nam });

// Book
// ----

type Book = {[name: string]: Term};

// Stringifier
// -----------

export const num_to_name = (num: number): string => {
  var nam = "";
  while (num >= 26) {
    nam += String.fromCharCode("a".charCodeAt(0) + (num % 26));
    num = Math.floor(num / 26);
  }
  nam += String.fromCharCode("a".charCodeAt(0) + num);
  return nam.split("").reverse().join("");
};

export const name = (numb: number): string => {
  let name = '';
  do {
    name = String.fromCharCode(97 + (numb % 26)) + name;
    numb = Math.floor(numb / 26) - 1;
  } while (numb >= 0);
  return name;
}

export const show = (term: Term, dep: number = 0): string => {
  switch (term.$) {
    case "Lam": return `λ${name(dep)} ${show(term.bod(Var(dep)), dep + 1)}`;
    case "App": return `(${show(term.fun, dep)} ${show(term.arg, dep)})`;
    case "Bri": return `θ${name(dep)} ${show(term.bod(Var(dep)), dep + 1)}`;
    case "Ann": return `{${show(term.val, dep)} : ${show(term.typ, dep)}}`;
    case "Var": return term.nam === -1 ? "*" : name(term.nam);
    case "Ref": return term.nam;
  }
};

export const compile = (term: Term, dep: number = 0): string => {
  switch (term.$) {
    case "Lam": return `(Lam λ${name(dep)} ${compile(term.bod(Var(dep)), dep + 1)})`;
    case "App": return `(App ${compile(term.fun, dep)} ${compile(term.arg, dep)})`;
    case "Bri": return `(Bri λ${name(dep)} ${compile(term.bod(Var(dep)), dep + 1)})`;
    case "Ann": return `(Ann ${compile(term.val, dep)} ${compile(term.typ, dep)})`;
    case "Var": return term.nam === -1 ? "Set" : name(term.nam);
    case "Ref": return term.nam;
  }
};

// Parser
// ------

export type Scope = List<[string, Term]>;

export function num_to_str(num: number): string {
  let txt = '';
  num += 1;
  while (num > 0) {
    txt += String.fromCharCode(((num-1) % 26) + 'a'.charCodeAt(0));
    num  = Math.floor((num-1) / 26);
  }
  return txt.split('').reverse().join('');
}

export function find<A>(list: Scope, nam: string): Term {
  switch (list.tag) {
    case "Cons": return list.head[0] === nam ? list.head[1] : find(list.tail, nam);
    case "Nil" : return Ref(nam);
  }
}

export function skip(code: string): string {
  while (true) {
    if (code.slice(0, 2) === "//") {
      do { code = code.slice(1); } while (code.length != 0 && code[0] != "\n");
      continue;
    }
    if (code[0] === "\n" || code[0] === " ") {
      code = code.slice(1);
      continue;
    }
    break;
  }
  return code;
}

export function is_name_char(c: string): boolean {
  return /[a-zA-Z0-9_.]/.test(c);
}

export function parse_name(code: string): [string, string] {
  code = skip(code);
  var name = "";
  while (is_name_char(code[0]||"")) {
    name = name + code[0];
    code = code.slice(1);
  }
  return [code, name];
}

export function parse_text(code: string, text: string): [string, null] {
  code = skip(code);
  if (text === "") {
    return [code, null];
  } else if (code[0] === text[0]) {
    return parse_text(code.slice(1), text.slice(1));
  } else {
    throw "parse error";
  }
}

export function parse_term(code: string): [string, (ctx: Scope) => Term] {
  code = skip(code);
  // LAM: `λx f`
  if (code[0] === "λ") {
    var [code, nam] = parse_name(code.slice(1));
    var [code, bod] = parse_term(code);
    return [code, ctx => Lam(x => bod(Cons([nam,x], ctx)))];
  }
  // APP: `(f x y z ...)`
  if (code[0] === "(") {
    var [code, fun] = parse_term(code.slice(1));
    var args: ((ctx: Scope) => Term)[] = [];
    while (code[0] !== ")") {
      var [code, arg] = parse_term(code);
      args.push(arg);
      code = skip(code);
    }
    var [code, _] = parse_text(code, ")");
    return [code, ctx => args.reduce((f, x) => App(f, x(ctx)), fun(ctx))];
  }
  // BRI: `θx T`
  if (code[0] === "θ") {
    var [code, nam] = parse_name(code.slice(1));
    var [code, bod] = parse_term(code);
    return [code, ctx => Bri(x => bod(Cons([nam, x], ctx)))];
  }
  // ANN: `{x : T}`
  if (code[0] === "{") {
    var [code, val] = parse_term(code.slice(1));
    var [code, _  ] = parse_text(code, ":");
    var [code, typ] = parse_term(code);
    var [code, _  ] = parse_text(code, "}");
    return [code, ctx => Ann(val(ctx), typ(ctx))];
  }
  // SET: `*`
  if (code[0] === "*") {
    return [code.slice(1), ctx => Var(-1)];
  }
  // FUN: `!A -> B` -SUGAR
  if (code[0] === "!") {
    var [code, typ] = parse_term(code.slice(1));
    var [code, _  ] = parse_text(code, "->");
    var [code, bod] = parse_term(code);
    return [code, ctx => App(App(Ref("Fun"), typ(ctx)), bod(ctx))];
  }
  // ALL: `Π(x: A) B[x]` -SUGAR
  if (code[0] === "Π") {
    var [code, nam] = parse_name(code.slice(2));
    var [code, _  ] = parse_text(code, ":");
    var [code, typ] = parse_term(code);
    var [code, __ ] = parse_text(code, ")");
    var [code, bod] = parse_term(code);
    return [code, ctx => App(App(Ref("All"), typ(ctx)), Lam(x => bod(Cons([nam,x], ctx))))];
  }
  // IND: `$s(x: A) B[s,x]` -SUGAR
  if (code[0] === "$") {
    var [code, slf] = parse_name(code.slice(1));
    var [code, _  ] = parse_text(code, "(");
    var [code, nam] = parse_name(code);
    var [code, _  ] = parse_text(code, ":");
    var [code, typ] = parse_term(code);
    var [code, __ ] = parse_text(code, ")");
    var [code, bod] = parse_term(code);
    return [code, ctx => App(App(Ref("Ind"), typ(ctx)), Lam(s => Lam(x => bod(Cons([nam,x], Cons([slf,s], ctx))))))];
  }
  // VAR: `name`
  var [code, nam] = parse_name(code);
  if (nam.length > 0) {
    return [code, ctx => find(ctx, nam)];
  }
  throw "parse error";
}

export function do_parse_term(code: string): Term {
  return parse_term(code)[1](Nil());
}

export function parse_def(code: string): [string, {nam: string, val: Term}] {
  var [code, nam] = parse_name(skip(code));
  if (skip(code)[0] === ":") {
    var [code, _  ] = parse_text(code, ":");
    var [code, typ] = parse_term(code);
    var [code, _  ] = parse_text(code, "=");
    var [code, val] = parse_term(code);
    return [code, {nam: nam, val: Ann(val(Nil()), typ(Nil()))}];
  } else {
    var [code, _  ] = parse_text(code, "=");
    var [code, val] = parse_term(code);
    return [code, {nam: nam, val: val(Nil())}];
  }
}

export function parse_book(code: string): Book {
  var book : Book = {};
  while (code.length > 0) {
    var [code, def] = parse_def(code);
    book[def.nam] = def.val;
    code = skip(code);
  }
  return book;
}

export function do_parse_book(code: string): Book {
  return parse_book(code);
}

// CLI
// ---

import * as fs from "fs";
import { execSync } from "child_process";

export function main() {
  // Loads ICC's HVM checker.
  var icc_hvml = fs.readFileSync(__dirname + "/ICC.hvml", "utf8");

  // Loads all local ".icc" files.
  const code = fs.readdirSync(".")
    .filter(file => file.endsWith(".icc"))
    .map(file => fs.readFileSync("./"+file, "utf8"))
    .join("\n");

  // Parses into book.
  const book = do_parse_book(code);

  // Compiles book to HVML.
  var book_hvml = "Names = [" + Object.keys(book).map(x => '"'+x+'"').join(",") + "]\n";
  var ref_count = 0;
  for (let name in book) {
    book_hvml += name + " = (Ref " + (ref_count++) + ' ' + compile(book[name]) + ")\n";
  }

  // Gets arguments.
  const args = process.argv.slice(2);
  const func = args[0];
  const name = args[1];

  // Creates main.
  var main_hvml = "";
  switch (func) {
    case "check": {
      main_hvml = "Main = (AnnCheck " + name + ")\n";
      break;
    }
    case "run": {
      main_hvml = "Main = (Run " + name + ")\n";
      break;
    }
    default: {
      console.log("Usage: icc [check|run] <name>");
    }
  }

  // Generates the 'checker.hvml' file.
  var checker_hvml = [icc_hvml, book_hvml, main_hvml].join("\n\n");

  // Saves locally.
  fs.writeFileSync("./.checker.hvml", checker_hvml);

  // Runs 'hvml checker.hvml -w -s -L -1'
  execSync("hvml run .checker.hvml -w -s -L -1", { stdio: "inherit" });

};

main();
