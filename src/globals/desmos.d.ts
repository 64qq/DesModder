declare global {
  // @types/desmos doesn't provide type definitions for `advancedStyling` and `authorFeatures`
  namespace Desmos {
    interface GraphConfiguration {
      advancedStyling?: boolean;
      authorFeatures?: boolean;
    }
    const Calculator: typeof GraphingCalculator;
  }
}
export {};
