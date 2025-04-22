let intellisenseTimeoutID = 0;
export const pendingIntellisenseTimeouts = new Set();
export const setIntellisenseTimeout = function (
  handler: () => void,
  timeout?: number
) {
  const thisInvocationID = intellisenseTimeoutID++;
  pendingIntellisenseTimeouts.add(thisInvocationID);
  // eslint-disable-next-line @desmodder/eslint-rules/no-timeouts-in-intellisense
  setTimeout(() => {
    handler();
    pendingIntellisenseTimeouts.delete(thisInvocationID);
  }, timeout);
};
