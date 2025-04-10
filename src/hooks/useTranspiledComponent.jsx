// hooks/useTranspiledComponent.js

const useTranspiledComponent = () => {
  const transpile = async (code, args, values) => {
    const transpiled = Babel.transform(code, {
      presets: ["react"],
    }).code;
    const factory = new Function(
      ...args,
      `${transpiled}; return GameComponent;`
    );
    return factory(...values);
  };

  return { transpile };
};

export default useTranspiledComponent;
