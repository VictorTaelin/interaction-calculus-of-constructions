// Type
// ----

type Term =
  | { $: "Lam"; bod: (x:Term)=> Term }
  | { $: "App"; fun: Term; arg: Term }
  | { $: "Bri"; bod: (x:Term)=> Term }
  | { $: "Ann"; val: Term; typ: Term }
  | { $: "Var"; nam: number };

// Constructors
// ------------

const Lam = (bod: (x:Term)=> Term): Term => ({ $: "Lam", bod });
const App = (fun: Term, arg: Term): Term => ({ $: "App", fun, arg });
const Bri = (bod: (x:Term)=> Term): Term => ({ $: "Bri", bod });
const Ann = (val: Term, typ: Term): Term => ({ $: "Ann", val, typ });
const Var = (nam: number): Term => ({ $: "Var", nam });

// Interactions
// ------------

const APP = (fun: Term, arg: Term): Term => {
  var fun = reduce(fun);
  switch (fun.$) {
    case "Lam": return reduce(fun.bod(arg));
    case "Bri": throw "Unsupported interaction: 'APP-TYP'.";
    default: return App(fun, arg);
  }
};

const ANN = (val: Term, typ: Term): Term => {
  var typ = reduce(typ);
  switch (typ.$) {
    case "Lam": throw "Unsupported interaction: 'ANN-LAM'.";
    case "Bri": return reduce(typ.bod(val));
    default: return Ann(val, typ);
  }
};

// Evaluation
// ----------

const reduce = (term: Term): Term => {
  if (term.$ === "App") {
    return APP(term.fun, term.arg);
  }
  if (term.$ === "Ann") {
    return ANN(term.val, term.typ);
  }
  return term;
};

const normal = (term: Term, dep: number): Term => {
  var term = reduce(term);
  switch (term.$) {
    case "Lam": return Lam(x => normal(term.bod(Var(dep)), dep+1));
    case "App": return App(normal(term.fun, dep), normal(term.arg, dep));
    case "Bri": return Bri(x => normal(term.bod(Var(dep)), dep+1));
    case "Ann": return Ann(normal(term.val, dep), normal(term.typ, dep));
    case "Var": return Var(term.nam);
  }
};

// Equality
// --------

const equal = (a: Term, b: Term, dep: number): boolean => {
  return compare(reduce(a), reduce(b), dep);
}

const compare = (a: Term, b: Term, dep: number): boolean => {
  if (a.$ === "Lam" && b.$ === "Lam") {
    return equal(a.bod(Var(dep)), b.bod(Var(dep)), dep+1);
  }
  if (a.$ === "App" && b.$ === "App") {
    return equal(a.fun, b.fun, dep) && equal(a.arg, b.arg, dep);
  }
  if (a.$ === "Bri" && b.$ === "Bri") {
    return equal(a.bod(Var(dep)), b.bod(Var(dep)), dep+1);
  }
  if (a.$ === "Ann" && b.$ === "Ann") {
    return equal(a.val, b.val, dep);
  }
  if (a.$ === "Var" && b.$ === "Var") {
    return a.nam === b.nam;
  }
  return false;
};

// Checking
// --------

const check = (term: Term, tipo: Term, dep: number): boolean => {
  var tipo = reduce(tipo);
  switch (tipo.$) {
    case "Bri": return infer(tipo.bod(term), dep);
    default: {
      var term = reduce(term);
      if (term.$ === "Ann") {
        console.log("equal", show(term.typ,dep), show(tipo,dep));
        return equal(term.typ, tipo, dep) && infer(term.val, dep);
      } else {
        return false;
      }
    }
  }
};

const infer = (term: Term, dep: number): boolean => {
  console.log("infer", show(term, dep));
  switch (term.$) {
    case "Lam": return infer(term.bod(Var(dep)), dep+1);
    case "App": return infer(term.fun, dep) && infer(term.arg, dep);
    case "Bri": return false;
    case "Ann": return check(term.val, term.typ, dep);
    case "Var": return true;
  }
};

// Encodings
// ---------

// Set ::= free-var
const Set = Var(-1);

// Any ::= θv v
const Any = Bri(x => x);

// (A -> B) ::= θf λx {(f {x: A}): B}
const Arr = (A: Term, B: Term): Term => Bri(f => Lam(x => Ann(App(f, Ann(x, A)), B)));

// (Π(x: A). B[x]) ::= θf λx {(f {x: A}): (B x)}
const All = (A: Term, B: (x: Term) => Term): Term => Bri(f => Lam(x => Ann(App(f, Ann(x, A)), B(x))));

// (Πf(x: A). B[x]) ::= θf λx {(f {x: A}): (B x f)}
const Ind = (A: Term, B: (f: Term, x: Term) => Term): Term => Bri(f => Lam(x => Ann(App(f, Ann(x, A)), B(f, x))));

// Stringication
// -------------

const show = (term: Term, dep: number): string => {
  switch (term.$) {
    case "Lam": return `λx${dep} ${show(term.bod(Var(dep)), dep + 1)}`;
    case "App": return `(${show(term.fun, dep)} ${show(term.arg, dep)})`;
    case "Bri": return `θx${dep} ${show(term.bod(Var(dep)), dep + 1)}`;
    case "Ann": return `{${show(term.val, dep)} : ${show(term.typ, dep)}}`;
    case "Var": return term.nam === -1 ? "*" : `x${term.nam}`;
  }
};

// Tests
// -----

const tru  = Lam(P => Lam(t => Lam(f => t)));
const fal  = Lam(P => Lam(t => Lam(f => f)));
const Bool = Ind(Set, (self,P) => Arr(App(P,tru), Arr(App(P,fal), App(P,self))));

const Test0 = All(Set, A => All(Set, B => Arr(Arr(A,A), Arr(Arr(A,B), Arr(Arr(B,A), Arr(Arr(B,B), Arr(A, Arr(B, A))))))));
const test0 = Lam(A => Lam(B => Lam(aa => Lam(ab => Lam(ba => Lam(bb => Lam(a => Lam(b => App(ba, App(ab, a))))))))));

const Test1 = All(Arr(Set,Bool), P => Arr(App(P,tru), Arr(App(P,fal), App(P,fal))));
const test1 = Lam(P => Lam(t => Lam(f => f)));

console.log(check(test1, Test1, 0));
