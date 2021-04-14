$(document).ready(function()
{
  document.querySelector(':root').style.setProperty('--mainColor', mainColor);
  document.querySelector(':root').style.setProperty('--mainColorTransparent', mainColorTransparent);
  document.querySelector(':root').style.setProperty('--secondaryColor', secondaryColor);
  document.querySelector(':root').style.setProperty('--secondaryColorHover', secondaryColorHover);
  document.querySelector(':root').style.setProperty('--titleColor', titleColor);

  $(window).bind("beforeunload", function() {
    if (tableChanged){
      return confirm("Do you really want to close?");
    }
  });
});

$(document).click(function (el) {
  setTableWidth();
});

function setTableWidth() {
  setTimeout(function(){
    if($('.dropdown-filter-content').is(":visible")) {
      $('.table-responsive').css("min-height", "50vh");
    }
    else if (!$('.dropdown-filter-content').is(":visible")) {
      $('.table-responsive').css("min-height", "0px")
    }
  }, 25);
}

//function to paste element without format
async function addPasteListener (){
  document.querySelectorAll('[contenteditable=true]').forEach(function(e){
    e.addEventListener('paste', function (event) {
      event.preventDefault();
      var text = (event.originalEvent || event).clipboardData.getData('text/plain');

      // insert text manually
      document.execCommand("insertHTML", false, text);
    });
  });
}


function openNav() {
  if(document.getElementById("mySidenav").style.width === "250px"){
    document.getElementById("mySidenav").style.width = "0";
    $('#header-div').css("padding-left", "15px");
    $('footer').css("padding-left", "0px");
  } else {
    document.getElementById("mySidenav").style.width = "250px";
    $('#header-div').css("padding-left", "265px");
    $('footer').css("padding-left", "265px");
  }
}

function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
  $('#header-div').css("padding-left", "15px");
  $('footer').css("padding-left", "0px");
}
