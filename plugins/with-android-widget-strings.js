const { AndroidConfig, withStringsXml } = require("expo/config-plugins");

const widgetStrings = [
  AndroidConfig.Resources.buildResourceItem({
    name: "budget_pulse_widget_display_name",
    value: "Budget Pulse",
  }),
  AndroidConfig.Resources.buildResourceItem({
    name: "budget_pulse_widget_description",
    value: "Lihat sisa budget dan status harian tanpa membuka aplikasi.",
  }),
];

module.exports = function withAndroidWidgetStrings(config) {
  return withStringsXml(config, (config) => {
    config.modResults = AndroidConfig.Strings.setStringItem(widgetStrings, config.modResults);
    return config;
  });
};
