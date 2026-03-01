import { LabelOptionsBase, Private } from "#globals";

const labelOptions = {
  smallCutoff: 0.00001,
  bigCutoff: 1000000,
  digits: 5,
  displayAsFraction: false,
} satisfies LabelOptionsBase;

const { Label } = Private.Mathtools;

type ComplexNumberLabel = typeof Label.complexNumberLabel;
type PointLabel = typeof Label.pointLabel;
type Point3dLabel = typeof Label.point3dLabel;
type TruncatedLatexLabel = typeof Label.truncatedLatexLabel;

const uprightUndefined = (label: string) =>
  label === "undefined" ? "\\mathrm{undefined}" : label;

export const complexNumberLabel = (label: Parameters<ComplexNumberLabel>[0]) =>
  uprightUndefined(Label.complexNumberLabel(label, labelOptions));
export const pointLabel = (label: Parameters<PointLabel>[0]) =>
  uprightUndefined(Label.pointLabel(label, labelOptions));
export const point3dLabel = (label: Parameters<Point3dLabel>[0]) =>
  uprightUndefined(Label.point3dLabel(label, labelOptions));
export const truncatedLatexLabel = (
  label: Parameters<TruncatedLatexLabel>[0]
) => uprightUndefined(Label.truncatedLatexLabel(label, labelOptions));
