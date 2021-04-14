var workbook;
var worksheet;
var tableChanged = false;
var editEnabled = false;

fetch(urlUsed + '/getFile').then(function(res) {
  if(!res.ok){
    alert("Error: no se pudo abrir el fichero.");
    throw new Error("fetch failed");
  }
  return res.arrayBuffer();
}).then(function(ab) {
  var data = new Uint8Array(ab);
  var wb = XLSX.read(data, {type:"array",cellText:false,cellDates:true, dateNF:"dd.MM.yyyy"});
  workbook = wb;
  $('#spinner').attr('style','display:none !important');
  ExportToTableFromUrl();
}).catch(function(error) {
  alert("Error en la conexión al servidor");
  $('#spinner').attr('style','display:none !important');
});

//Function to export excel table to html table
async function ExportToTableFromUrl() {
  $('#xport').show();
  loadFullTable(workbook, workbook.SheetNames[0]);
  /*Gets all the sheetnames of excel in to a variable*/
  var sheet_name_list = workbook.SheetNames;
  var cnt = 0; /*This is used for restricting the script to consider only first sheet of excel*/
  var excelNav = document.getElementById("excel-nav");
  var first = true;
  sheet_name_list.forEach(function (y) { /*Iterate through all sheets*/
    /*Convert the cell value to Json*/
    //var exceljson = XLSX.utils.sheet_to_json(workbook.Sheets[y]);
    var excelTab = document.createElement("a");
    var text = document.createTextNode(y);
    excelTab.className = "nav-item nav-link";
    if(first) {
      excelTab.className += " active";
      excelTab.setAttribute("aria-controls", "");
      excelTab.setAttribute("aria-selected", "true");
      first = false;
      worksheet = y;
    }
    excelTab.setAttribute("data-toggle", "tab");
    excelTab.setAttribute("role", "tab");
    excelTab.setAttribute("href", "#");

    excelTab.setAttribute("onclick", "openSheet(event, workbook, '" + y + "')");
    excelTab.appendChild(text);
    excelNav.appendChild(excelTab);
  });
}

//Function executed when changing between sheets
async function openSheet(evt, workbook, sheetName) {
  var tablinks = document.getElementsByClassName("nav-item");
  for (var i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  evt.currentTarget.className += " active";
  evt.currentTarget.setAttribute("aria-controls", "");
  evt.currentTarget.setAttribute("aria-selected", "true");
  worksheet = sheetName;
  //await removeEdit();
  await loadFullTable(workbook, sheetName);
  if (editEnabled) {
    await edit();
  }
}

//Function to load full table
async function loadFullTable(wb, sheetName) {
  var sh = sheetName;
  await process_wb_manually(wb, sheetName);
  document.getElementById('data-table').className = " table table-sm table-striped table-intel";
  document.getElementById('data-table').removeAttribute("border");
  await setTableHeader();
  await addColorToHeaderWithOffset();
  await checkEmptyRow();

  reAdjust();
  addPasteListener();
  $('#data-table').excelTableFilter({
    columnSelector: '.filter'
  });

  for (var i = 1; i < document.getElementById('data-table').rows[0].cells.length; i++) {
    var cellName = document.getElementById('data-table').rows[0].cells[i].innerText;
    $('.col input').bind('paste', null, function(e) {
      $input = $(this);
      setTimeout(function() {
        var values = $input.val().split(/\s+/),
          col = $input.closest('.col');
        for (var i = 0; i < values.length; i++) {
          col.find('input').val(values[i]);
          col = col.next();
        }
      }, 0);
    });
  }
}

//Function to parse excel to html table
async function process_wb_manually(wb, sheetName) {
  $('#data-table').empty();
  var sh = workbook.Sheets[sheetName];
  var cellsToAppend = "";
  var range = XLSX.utils.decode_range(sh['!ref']); // get the range
  for (var R = range.s.r; R <= range.e.r; ++R) {
    cellsToAppend += "<tr>";
    cellsToAppend += (R===0)?"<th style='min-width: 0px'>#</th>":"<td><b>" + R + "</b></td>";
    for (var C = range.s.c; C <= range.e.c; ++C) {
      var cellref = XLSX.utils.encode_cell({c: C, r: R}); // construct A1 reference for cell
      if (sh[cellref]){
        var cell = sh[cellref];
        if(R === 0){
          cellsToAppend += "<th class=\"filter\">" + cell.v + "</th>";
        } else {
          if (R> 0 && (sh[XLSX.utils.encode_cell({c: C, r: 0})].v === "startDate" || sh[XLSX.utils.encode_cell({c: C, r: 0})].v === "endDate" ||sh[XLSX.utils.encode_cell({c: C, r: 0})].v === "feeDateFrom" ||sh[XLSX.utils.encode_cell({c: C, r: 0})].v === "feeDateTo" )) {
            if(cell.v instanceof Date) {
              datePlusOne = new Date(cell.v.getTime() + 1000*60*60);
            } else {
              datePlusOne = cell.v;
            }
			      cellsToAppend += "<td id='r" + R + "c" + C + "'><span class='table_span' contenteditable='false' oninput='changeCell(" + C + ", " + R + "); return false'>" + datePlusOne.toLocaleString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            }) + "</span></td>";
          } else {
            cellsToAppend += "<td id='r" + R + "c" + C + "'><span class='table_span' contenteditable='false' oninput='changeCell(" + C + ", " + R + "); return false'>" + cell.v + "</span></td>";
          }
        }
      } else {
        if(sh[XLSX.utils.encode_cell({c: C, r: 0})]) {
          cellsToAppend += "<td id='r" + R + "c" + C + "'><span class='table_span' contenteditable='false' oninput='changeCell(" + C + ", " + R + "); return false'></span></td>";
        }
      }
    }
    cellsToAppend += "</tr>";
  }
  $('#data-table').append(cellsToAppend);
}

//Function to set constrains existing cells
async function setCellConstrains(sheetName){
  var sh = workbook.Sheets[sheetName];
  var range = XLSX.utils.decode_range(sh['!ref']); // get the range
  for (var R = range.s.r; R <= range.e.r; ++R) {
    for (var C = range.s.c; C <= range.e.c; ++C) {
      if(R>0) {
        var cellText = document.getElementById('data-table').rows[0].cells[C+1].innerText;
        var cellColor = document.getElementById('data-table').rows[0].cells[C+1].style.color;
        document.getElementById("r" + R + "c" + C).children[0].setAttribute("contenteditable", true);
        if (cellColor === "gray" || isConcatCells(cellText)) {
          document.getElementById("r" + R + "c" + C).children[0].setAttribute("contenteditable", false);
        } else if (isSelector(cellText)) {
          document.getElementById("r" + R + "c" + C).children[0].onfocus = function (e) {
            var cellVal = $(this).text();
            var id = this.parentElement.id;

            var getR = parseInt(id.substring(1,id.length).split("c")[0]);
            var getC = parseInt(id.substring(1,id.length).split("c")[1])+1;
            var cellText1 = document.getElementById('data-table').rows[0].cells[getC+1].innerText;
            var cellsToAppend = "";
            var selArray = getSelector(cellText1, 0);
            cellsToAppend += "<select required form=\"form-add-row\" class=\"form-control form-control-sm\" name=\"select\" id='selR"+getR+"C"+getC+"' onchange=\"fillCellFromSelectCell('selR"+getR+"C"+getC+"', "+getR+", "+getC+")\">";
            cellsToAppend += "<option disabled=\"disabled\" selected=\"selected\" style=\"display:none;\" value="+cellVal+" >" + cellVal + "</option>";
            for (var j = 1; j < selArray.length; j++) {
              cellsToAppend += "<option value=" + selArray[j] + ">" + selArray[j] + " </option>";
            }
            cellsToAppend += "</select>";
            $(this.parentElement).append(cellsToAppend);
            $(this).hide();
            this.parentElement.children[1].focus();
            this.parentElement.children[1].onblur = function (e) {
              $(this.parentElement.children[0]).text(this.parentElement.children[1].value);
              $(this.parentElement.children[0]).show();
              $(this).remove();
            };
          };
        } else if(isTrigger(cellText)) {
          document.getElementById("r" + R + "c" + C).children[0].oninput = function(e){
            var id = this.parentElement.id;
            //var getR = parseInt(id.substring(1,id.length).split("c")[0]);
            //var getC = parseInt(id.substring(1,id.length).split("c")[1]);
            var getR = parseInt(id.substring(1,id.length).split("c")[0]);
            var getC = parseInt(id.substring(1,id.length).split("c")[1])+1;
            fillConcatCell(document.getElementById("productTrigger"), getR, (getC-2));
            fillConcatCell(document.getElementById("cfsTrigger"), getR, (getC-2));
            fillConcatCell(document.getElementById("rfsTrigger"), getR, (getC-2));
            changeCell(getC-1, getR);
          }
        } else if(isDate(cellText)){
          document.getElementById("r" + R + "c" + C).children[0].onfocus = function(e){
            setTableChanged();
            var cellVal = $(this).text();
            var prevDateArray = cellVal.split("/");
            var prevDate = prevDateArray[2]+"-"+prevDateArray[1]+"-"+prevDateArray[0];
            var id = this.parentElement.id;
            var getR = parseInt(id.substring(1,id.length).split("c")[0]);
            var getC = parseInt(id.substring(1,id.length).split("c")[1])+1;
            var cellText1 = document.getElementById('data-table').rows[0].cells[getC].innerText;
            var cellsToAppend = "";
            cellsToAppend += "<input required type='date' max='9999-12-31' min='2000-01-01' value='"+prevDate+"' form=\"form-add-row\" class=\"form-control form-control-sm\" name=\"select\" id='dateR"+getR+"C"+getC+"'>";
            cellsToAppend += "</input>";
            $(this.parentElement).append(cellsToAppend);
            $(this).hide();
            this.parentElement.children[1].focus();
            this.parentElement.children[1].onblur = function (e) {
              let newDateArray = this.parentElement.children[1].value.split("-");
              if(newDateArray[2] && newDateArray[1] && newDateArray[0]) {
                let newDate = newDateArray[2] + "/" + newDateArray[1] + "/" +newDateArray[0];
                this.parentElement.children[0].innerText = newDate;
              }
              $(this.parentElement.children[0]).show();
              $(this).remove();
              changeCell(getC-1, getR);
            };
          }
        }
      }
    }
  }
  addPasteListener();
}

//Function to creating a form to add a new cell
async function createFormCells() {
  var cellsToAppend = "<form id=\"form-add-row\" onsubmit=\"addRow(this, worksheet); return false;\"><input type=\"hidden\" name=\"id\" value=\"1\" /></form>";
  cellsToAppend += "<div class=\"form-row\">";
  for (var i = 1; i < document.getElementById('data-table').rows[0].cells.length; i++) {
    var cellText = document.getElementById('data-table').rows[0].cells[i].innerText;
    var cellColor = document.getElementById('data-table').rows[0].cells[i].style.color;
    if(cellText !== "") {
      cellsToAppend += "<div class=\"col\">";
      if (isSelector(cellText)) {
        var selArray = getSelector(cellText, 0);
        cellsToAppend += "<select required form=\"form-add-row\" class=\"form-control form-control-sm\" name=\"select\" id=" + cellText + " onchange=\"fillCellInput(" + cellText + ")\">";
        cellsToAppend += "<option disabled value='' selected>" + cellText + "</option>";
        for (var j = 1; j < selArray.length; j++) {
          cellsToAppend += "<option value=" + selArray[j] + ">" + selArray[j] + " </option>";
        }
        cellsToAppend += "</select>";
      } else if(isTrigger(cellText)) {
        cellsToAppend += "<input required form=\"form-add-row\" class=\"form-control form-control-sm\" name=\"select\" id=" + cellText + " placeholder='" + cellText + "' onchange=\"fillConcatInput(" + cellText + ")\">";
      } else if(isDate(cellText)) {
        cellsToAppend += "<input required placeholder=" + cellText + " form=\"form-add-row\" class='form-control form-control-sm' type='text' onfocus=\"(this.type='date', this.max='9999-12-31', this.min='2000-01-01')\" id=" + cellText + ">";
        //cellsToAppend += "<input type='date' form=\"form-add-row\" class=\"form-control form-control-sm\" name=\"select\" id=" + cellText + " placeholder='" + cellText + "' onchange=\"fillConcatInput(" + cellText + ")\">";
      } else {
        if (cellColor === "gray" || isConcatCells(cellText)) {
          cellsToAppend += "<input disabled class ='cell-input form-control form-control-sm' id= '" + cellText + "'form=\"form-add-row\" type=\"text\" name=\"name\" placeholder='" + cellText + "' " + checkRequired(cellColor) + " />"
        } else {
          cellsToAppend += "<input class ='cell-input form-control form-control-sm' id= '" + cellText + "'form=\"form-add-row\" type=\"text\" name=\"name\" placeholder='" + cellText + "' " + checkRequired(cellColor) + " />"
        }
      }
      cellsToAppend += "</div>";
    }
  }
  cellsToAppend += "<button class='btn btn-info btn-sm' type=\"submit\" form=\"form-add-row\" value=\"Submit\"><b>Añadir</b></button></div>";
  $('#form-div').empty();
  $('#form-div').append(cellsToAppend);
}

//Function for adding a new row in the table
async function addRow(form, sh) {
  setTableChanged();
  var array = [];
  for(var i= 1; i<form.elements.length -1; i++){
    var inputId = form.elements[i].id;
    if(inputId === "startDate" || inputId === "endDate" || inputId === "feeDateFrom" || inputId === "feeDateTo"){
      let dateArray = form.elements[i].value.split("-");
      let newDate = dateArray[2] + "/" + dateArray[1] + "/" +dateArray[0];
      //array.push((new Date(form.elements[i].value))/(1000*60*60*24) + 25569);
      array.push(newDate);
    } else {
      array.push(form.elements[i].value);
    }
  }
  XLSX.utils.sheet_add_aoa(workbook.Sheets[sh], [array], {origin: -1});
  await process_wb_manually(workbook, sh);
  await setTableHeader();
  await addColorToHeaderWithOffset();
  await checkEmptyRow();
  await edit();
  addPasteListener();
  $(".dropdown-filter-dropdown").remove();
  $('#data-table').excelTableFilter({
    columnSelector: '.filter'
  });
  $('.table-responsive').scrollTop($('.table-responsive')[0].scrollHeight);
}

//Function for adding first row as table header
async function setTableHeader() {
  t = $('table#data-table');
  firstTr = t.find('tr:first').remove();
  firstTr.find('td').contents().unwrap().wrap('<th>');
  t.prepend($('<thead></thead>').append(firstTr))
}

//Function to check if cell is required
function checkRequired (color) {
  if(color === "red" || color === "orange" || color === "gray") {
    return "required";
  } else {
    return "";
  }
}

//Function to check if input is selector
function isSelector (text){
  var isSel = false;
  if(worksheet === "FEE_PRICE" || worksheet === "FEE_RAPPEL" || worksheet === "FEE_OCUP" || worksheet === "PDF_DESC") {
    if (text === "feeCode") {
      isSel = true;
    } else {
      isSel = false;
    }
  } else if(worksheet === "PRODUCT_USAGE_RIGHT" || worksheet === "PRODUCT_CHARGING_CONCEPT") {
    if (text === "productCode") {
      isSel = true;
    } else {
      isSel = false;
    }
  } else if(worksheet === "CFS_USAGE_RIGHT" || worksheet === "CFS_CHARGING_CONCEPT") {
    if (text === "cfsCode") {
      isSel = true;
    } else {
      isSel = false;
    }
  } else if(worksheet === "RFS_USAGE_RIGHT" || worksheet === "RFS_CHARGING_CONCEPT") {
    if (text === "rfsCode") {
      isSel = true;
    } else {
      isSel = false;
    }
  } else if(worksheet === "FORMULA_CHARGING_CONCEPT" || worksheet === "FORMULA_FEE_CONCEPT") {
    if (text === "formulaCode") {
      isSel = true;
    } else {
      isSel = false;
    }
  } else {
    isSel = false;
  }
  return isSel;
}

//Function to get options from selector
function getSelector (code, col) {
  var textArray = [];
  var sh = "";
  if (code === "feeCode") {
    sh = workbook.Sheets["FEE_HEADER"];
  } else if (code === "productCode") {
    sh = workbook.Sheets["PRODUCT_HEADER"];
  } else if (code === "cfsCode") {
    sh = workbook.Sheets["CFS_HEADER"];
  } else if (code === "rfsCode") {
    sh = workbook.Sheets["RFS_HEADER"];
  } else if (code === "formulaCode") {
    sh = workbook.Sheets["FORMULA_HEADER"];
  }

  if (sh !== ""){
    var range = XLSX.utils.decode_range(sh['!ref']); // get the range
    for (var R = range.s.r; R <= range.e.r; ++R) {
      for (var C = range.s.c; C <= range.e.c; ++C) {
        /* find the cell object */
        var cellref = XLSX.utils.encode_cell({c: C, r: R}); // construct A1 reference for cell
        if (sh[cellref]) { // if cell doesn't exist, move on
          var cell = sh[cellref];
          if (C === col) {
            textArray.push(cell.v);
          }
        }
      }
    }
  }
  return textArray;
}

//Function to get value from select input
function getValueFromSelector (keyHeader, keyCol, keyVal, offsetCol) {
  var value = "";
  var sh = "";
  if (keyHeader === "feeCode") {
    sh = workbook.Sheets["FEE_HEADER"];
  } else if (keyHeader === "productCode") {
    sh = workbook.Sheets["PRODUCT_HEADER"];
  } else if (keyHeader === "cfsCode") {
    sh = workbook.Sheets["CFS_HEADER"];
  } else if (keyHeader === "rfsCode") {
    sh = workbook.Sheets["RFS_HEADER"];
  } else if (keyHeader === "formulaCode") {
    sh = workbook.Sheets["FORMULA_HEADER"];
  }

  if(sh !== ""){
    var range = XLSX.utils.decode_range(sh['!ref']); // get the range
    for (var R = range.s.r; R <= range.e.r; ++R) {
      for (var C = range.s.c; C <= range.e.c; ++C) {
        var cellref = XLSX.utils.encode_cell({c: C, r: R}); // construct A1 reference for cell
        if (sh[cellref]) { // if cell doesn't exist, move on
          var cell = sh[cellref];
          if (C === keyCol) {
            if (cell.v === keyVal) {
              value = sh[XLSX.utils.encode_cell({c: C + offsetCol, r: R})].v;
            }
          }
        }
      }
    }
  }
  return value;
}

//Function to check if input is trigger
function isTrigger (text){
  var isTrigg = false;
  if(worksheet === "PRODUCT_CHARGING_CONCEPT"){
    if (text === "productTrigger") {
      isTrigg = true;
    } else {
      isTrigg = false;
    }
  } else if(worksheet === "CFS_CHARGING_CONCEPT"){
    if (text === "cfsTrigger") {
      isTrigg = true;
    } else {
      isTrigg = false;
    }
  } else if(worksheet === "RFS_CHARGING_CONCEPT"){
    if (text === "rfsTrigger") {
      isTrigg = true;
    } else {
      isTrigg = false;
    }
  }else {
    isTrigg = false;
  }
  return isTrigg;
}

//Function to check if input is trigger
function isDate (text){
  var isDateBool = false;
  if (text === "startDate" || text === "endDate" || text === "feeDateFrom" || text === "feeDateTo") {
    isDateBool = true;
  } else {
    isDateBool = false;
  }
  return isDateBool;
}

//Function triggered when selector changes
function fillCellInput (text) {
  if(document.getElementById("feeName")) document.getElementById("feeName").value = getValueFromSelector("feeCode", 0, text.value, 1);
  if(document.getElementById("productName")) document.getElementById("productName").value = getValueFromSelector("productCode", 0, text.value, 1);
  if(document.getElementById("cfsName")) document.getElementById("cfsName").value = getValueFromSelector("cfsCode", 0, text.value, 1);
  if(document.getElementById("rfsName")) document.getElementById("rfsName").value = getValueFromSelector("rfsCode", 0, text.value, 1);
  if(document.getElementById("formulaName")) document.getElementById("formulaName").value = getValueFromSelector("formulaCode", 0, text.value, 1);
  if(document.getElementById("chargingConceptName")){
    fillConcatInput(document.getElementById("productTrigger"));
    fillConcatInput(document.getElementById("cfsTrigger"));
    fillConcatInput(document.getElementById("rfsTrigger"));
  }
}

//Function triggered when selector changes
function fillCellFromSelectCell (id, row, column) {
  setTableChanged();
  document.getElementById("r"+row+"c"+(column-1)).children[0].innerText = document.getElementById(id).value;

  if(document.getElementById("feeName")) document.getElementById("r"+row+"c"+column).children[0].innerText = getValueFromSelector("feeCode", 0, document.getElementById(id).value, 1);
  if(document.getElementById("productName")) document.getElementById("r"+row+"c"+column).children[0].innerText = getValueFromSelector("productCode", 0, document.getElementById(id).value, 1);
  if(document.getElementById("cfsName")) document.getElementById("r"+row+"c"+column).children[0].innerText = getValueFromSelector("cfsCode", 0, document.getElementById(id).value, 1);
  if(document.getElementById("rfsName")) document.getElementById("r"+row+"c"+column).children[0].innerText = getValueFromSelector("rfsCode", 0, document.getElementById(id).value, 1);
  if(document.getElementById("formulaName")) document.getElementById("r"+row+"c"+column).children[0].innerText = getValueFromSelector("formulaCode", 0, document.getElementById(id).value, 1);
  if(document.getElementById("chargingConceptName")){
    fillConcatCell(document.getElementById("productTrigger"), row, column);
    fillConcatCell(document.getElementById("cfsTrigger"), row, column);
    fillConcatCell(document.getElementById("rfsTrigger"), row, column);
  }
  changeCell(column-1, row);
}

//Function triggered when selector changes
function fillConcatInput (text) {
  if (text && text.value !== "") {
    if (text === document.getElementById("productTrigger")) {
      if (document.getElementById("chargingConceptCode")) {
        if (document.getElementById("productCode") && document.getElementById("productCode").value !== "") document.getElementById("chargingConceptCode").value = document.getElementById("productCode").value + "_" + text.value;
      }
      if (document.getElementById("chargingConceptName")) {
        if (document.getElementById("productCode") && document.getElementById("productCode").value !== "") document.getElementById("chargingConceptName").value = document.getElementById("productCode").value + "_" + text.value + "_" + document.getElementById("productName").value;
      }
    } else if (text === document.getElementById("cfsTrigger")) {
      if (document.getElementById("chargingConceptCode")) {
        if (document.getElementById("cfsCode") && document.getElementById("cfsCode").value !== "") document.getElementById("chargingConceptCode").value = document.getElementById("cfsCode").value + "_" + text.value;
      }
      if (document.getElementById("chargingConceptName")) {
        if (document.getElementById("cfsCode") && document.getElementById("cfsCode").value !== "") document.getElementById("chargingConceptName").value = document.getElementById("cfsCode").value + "_" + text.value + "_" + document.getElementById("cfsName").value;
      }
    } else if (text === document.getElementById("rfsTrigger")) {
      if (document.getElementById("chargingConceptCode")) {
        if (document.getElementById("rfsCode") && document.getElementById("rfsCode").value !== "") document.getElementById("chargingConceptCode").value = document.getElementById("rfsCode").value + "_" + text.value;
      }
      if (document.getElementById("chargingConceptName")) {
        if (document.getElementById("rfsCode") && document.getElementById("rfsCode").value !== "") document.getElementById("chargingConceptName").value = document.getElementById("rfsCode").value + "_" + text.value + "_" + document.getElementById("rfsName").value;
      }
    }
  }
}

//Function triggered when selector changes
function fillConcatCell (text, row, column) {
  var getCode = document.getElementById("r"+row+"c"+(column-1)).children[0];
  var getName = document.getElementById("r"+row+"c"+column).children[0];
  var getTrigger = document.getElementById("r"+row+"c"+(column+1)).children[0];
  if (text) {
    if (text === document.getElementById("productTrigger")) {
      if (document.getElementById("chargingConceptCode")) {
        if (document.getElementById("productCode")) {
          var getChargingConceptCode = document.getElementById("r"+row+"c"+(column+4)).children[0];
          getChargingConceptCode.innerText = getCode.innerText + "_" + getTrigger.innerText;
          changeCell(column+4, row);
        }
      }
      if (document.getElementById("chargingConceptName")) {
        var getChargingConceptName = document.getElementById("r"+row+"c"+(column+5)).children[0];
        getChargingConceptName.innerText = getChargingConceptCode.innerText + "_" + getName.innerText;
        changeCell(column+5, row);
      }
    } else if (text === document.getElementById("cfsTrigger")) {
      if (document.getElementById("chargingConceptCode")) {
        var getChargingConceptCode = document.getElementById("r"+row+"c"+(column+4)).children[0];
        getChargingConceptCode.innerText = getCode.innerText + "_" + getTrigger.innerText;
        changeCell(column+4, row);
      }
      if (document.getElementById("chargingConceptName")) {
        var getChargingConceptName = document.getElementById("r"+row+"c"+(column+5)).children[0];
        getChargingConceptName.innerText = getChargingConceptCode.innerText + "_" + getName.innerText;
        changeCell(column+5, row);
      }
    } else if (text === document.getElementById("rfsTrigger")) {
      if (document.getElementById("chargingConceptCode")) {
        var getChargingConceptCode = document.getElementById("r"+row+"c"+(column+4)).children[0];
        getChargingConceptCode.innerText = getCode.innerText + "_" + getTrigger.innerText;
        changeCell(column+4, row);
      }
      if (document.getElementById("chargingConceptName")) {
        var getChargingConceptName = document.getElementById("r"+row+"c"+(column+5)).children[0];
        getChargingConceptName.innerText = getChargingConceptCode.innerText + "_" + getName.innerText;
        changeCell(column+5, row);
      }
    }
  }
}

//Function triggered when selector changes
function isConcatCells (cell) {
  if(worksheet === "PRODUCT_CHARGING_CONCEPT" || worksheet === "CFS_CHARGING_CONCEPT" || worksheet === "RFS_CHARGING_CONCEPT"){
    if (cell === "chargingConceptCode" || cell === "chargingConceptName"){
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

//Function to detect empty rows
async function checkEmptyRow (){
  var j = 0;
  for (var i=0; i< document.getElementById('data-table').rows.length; i++) {
    var rows = document.getElementById('data-table').rows;
    var txt = rows[i].textContent || rows[i].innerText;
    var tableIndex = rows[i].cells[1].textContent;

    if (txt.trim()===tableIndex) {
      let range = XLSX.utils.decode_range(workbook.Sheets[worksheet]["!ref"]);
      for (var R = range.s.r; R <= range.e.r; ++R) {
        for(var C = range.s.c; C <= range.e.c; ++C){
          if (R>=i) workbook.Sheets[worksheet][XLSX.utils.encode_cell({r:R,c:C})] = workbook.Sheets[worksheet][XLSX.utils.encode_cell({r:R+1,c:C})];
        }
      }
      document.getElementById('data-table').deleteRow(i);
      i--;
      range.e.r--;
      workbook.Sheets[worksheet]['!ref'] = XLSX.utils.encode_range(range.s, range.e);
    }
    j++;
  }
}

//Function to add color to header hardcoded //LAM. Esta es la función para cambiar los colores
async function addColorToHeaderWithOffset (){
  if (worksheet === "PARSEADOR"){
    document.getElementById('data-table').rows[0].cells[1].style.color = "red";
    document.getElementById('data-table').rows[0].cells[2].style.color = "red";
    document.getElementById('data-table').rows[0].cells[3].style.color = "red";
    document.getElementById('data-table').rows[0].cells[4].style.color = "red";
    document.getElementById('data-table').rows[0].cells[5].style.color = "red";
    document.getElementById('data-table').rows[0].cells[6].style.color = "red";
    document.getElementById('data-table').rows[0].cells[7].style.color = "red";
  } else if(worksheet === "PRODUCT_HEADER" || worksheet === "CFS_HEADER" || worksheet === "RFS_HEADER"){
    document.getElementById('data-table').rows[0].cells[1].style.color = "red";
    document.getElementById('data-table').rows[0].cells[2].style.color = "red";
    document.getElementById('data-table').rows[0].cells[3].style.color = "orange";
    document.getElementById('data-table').rows[0].cells[4].style.color = "orange";
    document.getElementById('data-table').rows[0].cells[5].style.color = "orange";
  } else if(worksheet === "PRODUCT_USAGE_RIGHT" || worksheet === "CFS_USAGE_RIGHT" || worksheet === "RFS_USAGE_RIGHT"){
    document.getElementById('data-table').rows[0].cells[1].style.color = "red";
    document.getElementById('data-table').rows[0].cells[2].style.color = "red";
    document.getElementById('data-table').rows[0].cells[3].style.color = "gray";
    document.getElementById('data-table').rows[0].cells[4].style.color = "red";
    document.getElementById('data-table').rows[0].cells[5].style.color = "red";
    document.getElementById('data-table').rows[0].cells[6].style.color = "red";
    document.getElementById('data-table').rows[0].cells[7].style.color = "red";
    document.getElementById('data-table').rows[0].cells[8].style.color = "orange";
    document.getElementById('data-table').rows[0].cells[9].style.color = "red";
    document.getElementById('data-table').rows[0].cells[10].style.color = "red";
    document.getElementById('data-table').rows[0].cells[11].style.color = "red";
  } else if(worksheet === "PRODUCT_CHARGING_CONCEPT" || worksheet === "CFS_CHARGING_CONCEPT"|| worksheet === "RFS_CHARGING_CONCEPT"){
    document.getElementById('data-table').rows[0].cells[1].style.color = "red";
    document.getElementById('data-table').rows[0].cells[2].style.color = "red";
    document.getElementById('data-table').rows[0].cells[3].style.color = "gray";
    document.getElementById('data-table').rows[0].cells[4].style.color = "red";
    document.getElementById('data-table').rows[0].cells[5].style.color = "red";
    document.getElementById('data-table').rows[0].cells[6].style.color = "red";
    document.getElementById('data-table').rows[0].cells[7].style.color = "red";
    document.getElementById('data-table').rows[0].cells[8].style.color = "orange";
    document.getElementById('data-table').rows[0].cells[9].style.color = "red";
  } else if(worksheet === "FORMULA_HEADER" || worksheet === "FEE_HEADER"){
    document.getElementById('data-table').rows[0].cells[1].style.color = "red";
    document.getElementById('data-table').rows[0].cells[2].style.color = "orange";
  } else if(worksheet === "FORMULA_CHARGING_CONCEPT"){
    document.getElementById('data-table').rows[0].cells[1].style.color = "red";
    document.getElementById('data-table').rows[0].cells[2].style.color = "gray";
    document.getElementById('data-table').rows[0].cells[3].style.color = "red";
    document.getElementById('data-table').rows[0].cells[4].style.color = "red";
  } else if(worksheet === "FORMULA_FEE_CONCEPT"){
    document.getElementById('data-table').rows[0].cells[1].style.color = "blue";
    document.getElementById('data-table').rows[0].cells[2].style.color = "red";
    document.getElementById('data-table').rows[0].cells[3].style.color = "gray";
    document.getElementById('data-table').rows[0].cells[4].style.color = "red";
    document.getElementById('data-table').rows[0].cells[5].style.color = "red";
    document.getElementById('data-table').rows[0].cells[6].style.color = "red";
  } else if(worksheet === "FEE_PRICE"){
    document.getElementById('data-table').rows[0].cells[1].style.color = "red";
    document.getElementById('data-table').rows[0].cells[2].style.color = "red";
    document.getElementById('data-table').rows[0].cells[3].style.color = "blue";
    document.getElementById('data-table').rows[0].cells[4].style.color = "blue";
    document.getElementById('data-table').rows[0].cells[5].style.color = "red";
    document.getElementById('data-table').rows[0].cells[6].style.color = "red";
    document.getElementById('data-table').rows[0].cells[7].style.color = "red";
    document.getElementById('data-table').rows[0].cells[8].style.color = "red";
    document.getElementById('data-table').rows[0].cells[9].style.color = "red";
    document.getElementById('data-table').rows[0].cells[10].style.color = "red";
    document.getElementById('data-table').rows[0].cells[11].style.color = "red";
  } else if(worksheet === "FEE_RAPPEL" || worksheet === "FEE_OCUP"){
    document.getElementById('data-table').rows[0].cells[1].style.color = "blue";
    document.getElementById('data-table').rows[0].cells[2].style.color = "red";
    document.getElementById('data-table').rows[0].cells[3].style.color = "gray";
    document.getElementById('data-table').rows[0].cells[4].style.color = "red";
    document.getElementById('data-table').rows[0].cells[5].style.color = "red";
    document.getElementById('data-table').rows[0].cells[6].style.color = "orange";
    document.getElementById('data-table').rows[0].cells[7].style.color = "orange";
    document.getElementById('data-table').rows[0].cells[8].style.color = "red";
    document.getElementById('data-table').rows[0].cells[9].style.color = "red";
    document.getElementById('data-table').rows[0].cells[10].style.color = "red";
  } else if(worksheet === "TRX_PRICE"){
    document.getElementById('data-table').rows[0].cells[1].style.color = "blue";
    document.getElementById('data-table').rows[0].cells[2].style.color = "red";
    document.getElementById('data-table').rows[0].cells[3].style.color = "red";
    document.getElementById('data-table').rows[0].cells[4].style.color = "red";
  } else if (worksheet === "ATP_FEES" || worksheet === "ICX_FEES"|| worksheet === "TRX_FEES"){
    for (var i = 1; i < document.getElementById('data-table').rows[0].cells.length; i++) {
      document.getElementById('data-table').rows[0].cells[i].style.color = "orange";
    }
  } else if(worksheet === "PDF_DESC"){
    document.getElementById('data-table').rows[0].cells[1].style.color = "red";
    document.getElementById('data-table').rows[0].cells[2].style.color = "gray";
    document.getElementById('data-table').rows[0].cells[3].style.color = "red";
    document.getElementById('data-table').rows[0].cells[4].style.color = "red";
    document.getElementById('data-table').rows[0].cells[5].style.color = "red";
  }
}

//Function modify existing cell
async function changeCell (col, row){
  setTableChanged();
  var cellValue = document.getElementById("r" + row + "c" + col).children[0].innerText;
  var cellref = XLSX.utils.encode_cell({c: col, r: row});
  workbook.Sheets[worksheet][cellref] = {
    v: cellValue
  };
  await checkEmptyRow();
  /*
  filterCollection.filterMenus[col].reload2();
  filterCollection.bindCheckboxes();
  filterCollection.bindSelectAllCheckboxes();
  filterCollection.bindSort();
  filterCollection.bindSearch();
  */
  document.querySelectorAll('tr').forEach(function(e) {
    $(e).show();
  });
  $(".dropdown-filter-dropdown").remove();
  $('#data-table').excelTableFilter({
    columnSelector: '.filter'
  });
}

//Function for downloading Excel file
function doit(type, fn, dl) {
  tableChanged = false;
  editEnabled = true;
  $('#xportxlsx').prop("disabled", true);
  $('#xportxlsx').css("background-color", "#6c757d");
  $('#xportxlsx').css("border-color", "#6c757d");
  setEdit();
  //var data =  XLSX.write(workbook, {bookType:type, bookSST:true, type: 'base64'});
  var data = XLSX.write(workbook, {bookType: 'xlsx', type: 'array'});
  var fd = new FormData();
  fd.append('excelFile', new File([data], 'sheetjs.xlsx'));
  fetch(urlUsed + "/uploadFile", {method: "POST", body: fd}).then(function(res) {
    if(res.status === 200){
      $("#upload-success").modal("show");
    } else {
      alert("Error al guardar fichero");
    }
  }).catch(function(error) {
    alert("Error en la conexión al servidor");
  });
}
