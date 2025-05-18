declare global {
  namespace Desmos {
    interface GraphConfiguration {
      advancedStyling?: boolean;
      authorFeatures?: boolean;
      showPerformanceMeter?: boolean;
    }
    const Calculator: typeof GraphingCalculator;
  }
}
export {};
