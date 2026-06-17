import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";

import translationEN from "./locales/en/translation.json";
import translationVI from "./locales/vi/translation.json";
import translationJA from "./locales/ja/translation.json";

const resources = {
  en: {
    translation: translationEN,
  },
  vi: {
    translation: translationVI,
  },
  ja: {
    translation: translationJA,
  },
};

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(Backend)
  .init({
    // debug: true,
    fallbackLng: "vi",
    load: "languageOnly",
    keySeparator: false,
    nsSeparator: false,
    simplifyPluralSuffix: false,
    pluralSeparator: null,
    contextSeparator: null,
    interpolation: {
      escapeValue: false,
    },
    resources,
  });

/*eslint no-template-curly-in-string: "off" */
export function generateLocaleForAntD(t) {
  const locale = {
    locale: t("en"),
    Pagination: {
      items_per_page: t("/ page"),
      jump_to: t("Go to"),
      jump_to_confirm: t("confirm"),
      page: t("Page"),
      prev_page: t("Previous Page"),
      next_page: t("Next Page"),
      prev_5: t("Previous 5 Pages"),
      next_5: t("Next 5 Pages"),
      prev_3: t("Previous 3 Pages"),
      next_3: t("Next 3 Pages"),
      page_size: t("Page Size"),
    },
    DatePicker: {
      lang: {
        placeholder: t("Select date"),
        yearPlaceholder: t("Select year"),
        quarterPlaceholder: t("Select quarter"),
        monthPlaceholder: t("Select month"),
        weekPlaceholder: t("Select week"),
        rangePlaceholder: [t("Start date"), t("End date")],
        rangeYearPlaceholder: [t("Start year"), t("End year")],
        rangeQuarterPlaceholder: [t("Start quarter"), t("End quarter")],
        rangeMonthPlaceholder: [t("Start month"), t("End month")],
        rangeWeekPlaceholder: [t("Start week"), t("End week")],
        locale: t("en_US"),
        today: t("Today"),
        now: t("Now"),
        backToToday: t("Back to today"),
        ok: t("OK"),
        clear: t("Clear"),
        month: t("Month"),
        year: t("Year"),
        timeSelect: t("select time"),
        dateSelect: t("select date"),
        weekSelect: t("Choose a week"),
        monthSelect: t("Choose a month"),
        yearSelect: t("Choose a year"),
        decadeSelect: t("Choose a decade"),
        yearFormat: t("YYYY"),
        dateFormat: t("M/D/YYYY"),
        dayFormat: t("D"),
        dateTimeFormat: t("M/D/YYYY HH:mm:ss"),
        monthBeforeYear: true,
        previousMonth: t("Previous month (PageUp)"),
        nextMonth: t("Next month (PageDown)"),
        previousYear: t("Last year (Control + left)"),
        nextYear: t("Next year (Control + right)"),
        previousDecade: t("Last decade"),
        nextDecade: t("Next decade"),
        previousCentury: t("Last century"),
        nextCentury: t("Next century"),
      },
      timePickerLocale: {
        placeholder: t("Select time"),
        rangePlaceholder: [t("Start time"), t("End time")],
      },
    },
    TimePicker: {
      placeholder: t("Select time"),
      rangePlaceholder: [t("Start time"), t("End time")],
    },
    Calendar: {
      lang: {
        placeholder: t("Select date"),
        yearPlaceholder: t("Select year"),
        quarterPlaceholder: t("Select quarter"),
        monthPlaceholder: t("Select month"),
        weekPlaceholder: t("Select week"),
        rangePlaceholder: [t("Start date"), t("End date")],
        rangeYearPlaceholder: [t("Start year"), t("End year")],
        rangeQuarterPlaceholder: [t("Start quarter"), t("End quarter")],
        rangeMonthPlaceholder: [t("Start month"), t("End month")],
        rangeWeekPlaceholder: [t("Start week"), t("End week")],
        locale: t("en_US"),
        today: t("Today"),
        now: t("Now"),
        backToToday: t("Back to today"),
        ok: t("OK"),
        clear: t("Clear"),
        month: t("Month"),
        year: t("Year"),
        timeSelect: t("select time"),
        dateSelect: t("select date"),
        weekSelect: t("Choose a week"),
        monthSelect: t("Choose a month"),
        yearSelect: t("Choose a year"),
        decadeSelect: t("Choose a decade"),
        yearFormat: t("YYYY"),
        dateFormat: t("M/D/YYYY"),
        dayFormat: t("D"),
        dateTimeFormat: t("M/D/YYYY HH:mm:ss"),
        monthBeforeYear: true,
        previousMonth: t("Previous month (PageUp)"),
        nextMonth: t("Next month (PageDown)"),
        previousYear: t("Last year (Control + left)"),
        nextYear: t("Next year (Control + right)"),
        previousDecade: t("Last decade"),
        nextDecade: t("Next decade"),
        previousCentury: t("Last century"),
        nextCentury: t("Next century"),
      },
      timePickerLocale: {
        placeholder: t("Select time"),
        rangePlaceholder: [t("Start time"), t("End time")],
      },
    },
    global: {
      placeholder: t("Please select"),
    },
    Table: {
      filterTitle: t("Filter menu"),
      filterConfirm: t("OK"),
      filterReset: t("Reset"),
      filterEmptyText: t("No filters"),
      filterCheckall: t("Select all items"),
      filterSearchPlaceholder: t("Search in filters"),
      emptyText: t("No data"),
      selectAll: t("Select current page"),
      selectInvert: t("Invert current page"),
      selectNone: t("Clear all data"),
      selectionAll: t("Select all data"),
      sortTitle: t("Sort"),
      expand: t("Expand row"),
      collapse: t("Collapse row"),
      triggerDesc: t("Click to sort descending"),
      triggerAsc: t("Click to sort ascending"),
      cancelSort: t("Click to cancel sorting"),
    },
    Modal: {
      okText: t("OK"),
      cancelText: t("Cancel"),
      justOkText: t("OK"),
    },
    Popconfirm: {
      okText: t("OK"),
      cancelText: t("Cancel"),
    },
    Transfer: {
      titles: ["t(", ")"],
      searchPlaceholder: t("Search here"),
      itemUnit: t("item"),
      itemsUnit: t("items"),
      remove: t("Remove"),
      selectCurrent: t("Select current page"),
      removeCurrent: t("Remove current page"),
      selectAll: t("Select all data"),
      removeAll: t("Remove all data"),
      selectInvert: t("Invert current page"),
    },
    Upload: {
      uploading: t("Uploading..."),
      removeFile: t("Remove file"),
      uploadError: t("Upload error"),
      previewFile: t("Preview file"),
      downloadFile: t("Download file"),
    },
    Empty: {
      description: t("No data"),
    },
    Icon: {
      icon: t("icon"),
    },
    Text: {
      edit: t("Edit"),
      copy: t("Copy"),
      copied: t("Copied"),
      expand: t("Expand"),
    },
    PageHeader: {
      back: t("Back"),
    },
    Form: {
      optional: t("(optional)"),
      defaultValidateMessages: {
        default: t("Field validation error for ${label}"),
        required: t("Please enter ${label}"),
        enum: t("${label} must be one of [${enum}]"),
        whitespace: t("${label} cannot be a blank character"),
        date: {
          format: t("${label} date format is invalid"),
          parse: t("${label} cannot be converted to a date"),
          invalid: t("${label} is an invalid date"),
        },
        types: {
          string: t("${label} is not a valid ${type}"),
          method: t("${label} is not a valid ${type}"),
          array: t("${label} is not a valid ${type}"),
          object: t("${label} is not a valid ${type}"),
          number: t("${label} is not a valid ${type}"),
          date: t("${label} is not a valid ${type}"),
          boolean: t("${label} is not a valid ${type}"),
          integer: t("${label} is not a valid ${type}"),
          float: t("${label} is not a valid ${type}"),
          regexp: t("${label} is not a valid ${type}"),
          email: t("${label} is not a valid ${type}"),
          url: t("${label} is not a valid ${type}"),
          hex: t("${label} is not a valid ${type}"),
        },
        string: {
          len: t("${label} must be ${len} characters"),
          min: t("${label} must be at least ${min} characters"),
          max: t("${label} must be up to ${max} characters"),
          range: t("${label} must be between ${min}-${max} characters"),
        },
        number: {
          len: t("${label} must be equal to ${len}"),
          min: t("${label} must be minimum ${min}"),
          max: t("${label} must be maximum ${max}"),
          range: t("${label} must be between ${min}-${max}"),
        },
        array: {
          len: t("Must be ${len} ${label}"),
          min: t("At least ${min} ${label}"),
          max: t("At most ${max} ${label}"),
          range: t("The amount of ${label} must be between ${min}-${max}"),
        },
        pattern: {
          mismatch: t("${label} does not match the pattern ${pattern}"),
        },
      },
    },
    Image: {
      preview: t("Preview"),
    },
  };
  return locale;
}
