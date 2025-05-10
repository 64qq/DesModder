import { clean, testWithPage } from "#tests";

testWithPage("More Greek Letters", async (driver) => {
  await driver.enablePlugin("custom-mathquill-config");
  await driver.focusIndex(0);
  await driver.setPluginSetting(
    "custom-mathquill-config",
    "extendedGreek",
    true
  );
  await driver.keyboard.type("omega");
  await driver.assertSelectedItemLatex("\\omega");

  await driver.clean();
  return clean;
});

testWithPage("Operators in Exponents", async (driver) => {
  await driver.enablePlugin("custom-mathquill-config");
  await driver.focusIndex(0);
  await driver.setPluginSetting(
    "custom-mathquill-config",
    "superscriptOperators",
    true
  );
  await driver.keyboard.type("e^2+2");
  await driver.assertSelectedItemLatex("e^{2+2}");

  await driver.clean();
  return clean;
});
