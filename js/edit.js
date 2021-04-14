//Toggle edit button
async function setEdit() {
  if(!editEnabled){
    editEnabled = true;
    $('#editButton').css("background-color", secondaryColor);
    $('#editButton').css("border-color", secondaryColor);
    $('.btn-success.focus').css("box-shadow", "0 0 0 0 " + secondaryColor);
    $('.btn-success:focus').css("box-shadow", "0 0 0 0 " + secondaryColor)
    $('.table-responsive').css("max-height", "60vh");
    await edit();
  } else {
    editEnabled = false;
    $('#editButton').css("background-color", mainColor);
    $('#editButton').css("border-color", mainColor);
    $('.btn-success.focus').css("box-shadow", "0 0 0 0 " + mainColor);
    $('.btn-success:focus').css("box-shadow", "0 0 0 0 " + mainColor)
    $('.table-responsive').css("max-height", "65vh");
    await removeEdit();
    await process_wb_manually(workbook, worksheet);
    await setTableHeader();
    await addColorToHeaderWithOffset();
    await checkEmptyRow();
    $(".dropdown-filter-dropdown").remove();
    $('#data-table').excelTableFilter({
      columnSelector: '.filter'
    });
  }
}

//Function when edit is active
async function edit() {
  document.querySelectorAll('tr').forEach(function(e) {
    $(e).show();
  });
  createFormCells();
  setCellConstrains(worksheet);
  var header = $('thead');
  var headerContentToAppend = "<th style='min-width: 0px'></th>";
  var table = $('tbody');
  var tble = document.getElementById('data-table');
  var rows = tble.rows;
  if(rows.length>1) header.find('th').eq(0).before(headerContentToAppend);

  table.find("tr").each(function(index) {
    var ind = index+1;
    var rowContentToAppend = "<td><span id='trash-"+ ind + "' style='color: #dc3545' onclick='confirmDeleteRow(this)' class=\"fa fa-trash\" ></span></td>";
    $(this).find('td').eq(0).before(rowContentToAppend);
  });
  //$("#editButton").remove();
  $(".dropdown-filter-dropdown").remove();
  $('#data-table').excelTableFilter({
    columnSelector: '.filter'
  });
  //var colsLength = document.getElementById('data-table').rows[0].cells.length;
}

//Function when edit is not active
async function removeEdit() {
  $('#form-div').empty();

  var tble = document.getElementById('data-table');
  var row = tble.rows;
  var i = 0;
  if(row.length > 1) {
    for (var j = 0; j < row.length; j++) {
      // Deleting the ith cell of each row.
      row[j].deleteCell(i);
    }
  }

  var cells = document.getElementsByClassName("table_span");
  for (var i = 0; i < cells.length; i++) {
    cells[i].setAttribute("contenteditable", false);
  }
}

//Function to show modal to confirm delete row
async function confirmDeleteRow(el){
  $("#delete-modal").modal("show");
  $("#delete").unbind().click(function() {
    deleteRowFromButton(el);
    $("#delete-modal").modal("hide");
  });
  $("#cancel").unbind().click(function() {
    $("#delete-modal").modal("hide");
  });
}

//Function to delete row when clicking trash button
async function deleteRowFromButton(el){
  setTableChanged()
  var rIndex = el.id.split("-")[1];
  var colsLength = document.getElementById('data-table').rows[0].cells.length;
  for (var i = 0; i < colsLength-2; i++) {
    var cell = document.getElementById("r"+rIndex+"c"+i);
    cell.children[0].innerText = "";
    await changeCellForDeletingRow();
  }
}

//Function to enable save button
function setTableChanged(){
  tableChanged = true;
  $('#xportxlsx').prop("disabled", false);
  $('#xportxlsx').css("background-color", mainColor);
  $('#xportxlsx').css("border-color", mainColor);
}

//Function modify existing cell
async function changeCellForDeletingRow (){
  await checkEmptyRow();
  $(".dropdown-filter-dropdown").remove();
  $('#data-table').excelTableFilter({
    columnSelector: '.filter'
  });
}
