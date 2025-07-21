export function process(sourceText, sourcePath, config) {
  return {
    code: `module.exports = ${JSON.stringify(sourceText)}`,
  };
}

export default { process };
