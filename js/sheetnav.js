
var hidWidth;
var scrollBarWidths = 40;
var leftDisabled = false;
var rightDisabled = false;

var widthOfList = function(){
  var itemsWidth = 0;
  $('.list a').each(function(){
    var itemWidth = $(this).outerWidth();
    itemsWidth+=itemWidth;
  });
  return itemsWidth;
};

var widthOfHidden = function(){
  var ww = 0 - $('.wrapper').outerWidth();
  var hw = (($('.wrapper').outerWidth())-widthOfList()-getLeftPosi())-scrollBarWidths;
  var rp = $(document).width() - ($('.nav-item.nav-link').last().offset().left + $('.nav-item.nav-link').last().outerWidth());

  if (ww>hw) {
    //return ww;
    return (rp>ww?rp:ww);
  }
  else {
    //return hw;
    return (rp>hw?rp:hw);
  }
};

var getLeftPosi = function(){

  var ww = 0 - $('.wrapper').outerWidth();
  var lp = $('.list').position().left;

  if (ww>lp) {
    return ww;
  }
  else {
    return lp;
  }
};

var reAdjust = function(){
  if($('.nav-item').offset()) {
    // check right pos of last nav item
    var rp = $('.wrapper').outerWidth() - ($('.nav-item').last().offset().left + $('.nav-item').last().outerWidth() - $('.wrapper').offset().left);
    if ($('.wrapper').outerWidth() < widthOfList() && (rp < 0)) {
      $('.scroller-right').show().css('display', 'flex');
    } else {
      $('.scroller-right').hide();
    }

    if (getLeftPosi() < 0) {
      $('.scroller-left').css('display', 'flex').hide();
      $('.scroller-left').show();
    } else {
      $('.item').animate({left: "-=" + getLeftPosi() + "px"}, 'slow');
      $('.scroller-left').hide();
    }
  }
}

$(window).on('resize',function(e){
  reAdjust();
});

$('.scroller-right').click(function() {
  $('.scroller-left').css('display', 'flex');
  if (rightDisabled)
    return;
  rightDisabled = true;
  $('.scroller-right').fadeOut('slow');
  $('.scroller-left').fadeIn('slow');

  var rpa = $('.wrapper').outerWidth() - ($('.nav-item').last().offset().left + $('.nav-item').last().outerWidth() - $('.wrapper').offset().left);

  var pxAdjust = -700;
  if (rpa > pxAdjust) {
    pxAdjust = rpa;
  }
  $('.list').animate({left: "+=" + pxAdjust + "px"}, 'slow', function () {
    reAdjust();
  });
  setTimeout(function(){rightDisabled = false;}, 800);
});

$('.scroller-left').click(function() {

  if (leftDisabled)
    return;
  leftDisabled = true;
  $('.scroller-right').fadeIn('slow');
  $('.scroller-left').fadeOut('slow');

  $('.list').animate({left:"-="+getLeftPosi()+"px"},'slow',function(){
    reAdjust();
  });
  setTimeout(function(){leftDisabled = false;}, 800);
});

