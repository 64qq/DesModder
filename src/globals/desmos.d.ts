declare global {
  namespace Desmos {
    interface GraphConfiguration {
      advancedStyling?: boolean;
      authorFeatures?: boolean;
      showPerformanceMeter?: boolean;
    }
    const Calculator: typeof GraphingCalculator;
    const Private: {
      Fragile: {
        /** Used by i18n-core.ts */
        currentLanguage: () => string;
      };
    };
  }
}
export {};
