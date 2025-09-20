<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/handsontable/styles/handsontable.min.css"
    />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/handsontable/styles/ht-theme-main.min.css"
    />

    <script
      type="text/javascript"
      src="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.js"
    ></script>

    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>

    <style>
      html,
      body {
        margin: 0;
        padding: 0;
      }

      body {
      }

      .excel-container {
        width: 100%;
        height: 100vh;
      }
    </style>
  </head>
  <body>
    <div class="app">
      <div class="excel-container"></div>
    </div>

    <script>
      const container = document.querySelector(".excel-container");
      const data = $data;

      let hot,
        tableBoxHeight,
        autoSave = true;

      window.onload = init;

      function getTableBoxHeight() {
        return container.clientHeight;
      }
      
      function init() {
        tableBoxHeight = getTableBoxHeight();

        hot = new Handsontable(container, {
          // theme name with obligatory ht-theme-* prefix
          themeName: "ht-theme-main",
          // other options
          data: data,
          colHeaders: $colHeaders,
          columns: $columns,
          undo: true,
          rowHeaders: true,
          height: tableBoxHeight,
          colWidths: 200,
          licenseKey: "non-commercial-and-evaluation", // for non-commercial use only
          manualColumnResize: true,
          stretchH: "all",
          manualRowFreeze: true,
          afterChange: (changes) => {
            changes?.forEach(([row, prop, oldValue, newValue]) => {
              if (autoSave) {
                axios.post("/api/update-column", {
                  key: data[row].key,
                  prop,
                  oldValue,
                  newValue,
                });
              }
            });
          },
        });
      }
    </script>
  </body>
</html>
