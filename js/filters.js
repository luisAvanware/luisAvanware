var filterCollection;

(function ($$1) {
  'use strict';

  $$1 = 'default' in $$1 ? $$1['default'] : $$1;

  var FilterMenu = function () {
    function FilterMenu(target, th, column, index, options) {
      this.options = options;
      this.target = target;
      this.th = th;
      this.column = column;
      this.index = index;
      this.tds = target.find('tbody tr td:nth-child(' + (this.column + 1) + ')').toArray();
      FilterMenu = FilterMenu.bind(FilterMenu);
    }
    FilterMenu.prototype.initialize = function (index) {
      this.menu = this.dropdownFilterDropdown(index);
      this.th.appendChild(this.menu);
      var $trigger = $(this.menu.children[0]);
      var $content = $(this.menu.children[1]);
      var $menu = $(this.menu);
      $trigger.click(function () {
        //if($('.dropdown-filter-content').is(":visible")) $('.table-responsive').css("min-height", "0px");
        //else if (!$('.dropdown-filter-content').is(":visible")) $('.table-responsive').css("min-height", "50vh")
        return $content.toggle();
      });
      $(document).click(function (el) {
        if (!$menu.is(el.target) && $menu.has(el.target).length === 0) {
          $content.hide();
        }
      });
    };
    FilterMenu.prototype.reload = function () {
      var _this = this;
      var colIndex = this.column - 2;
      this.tds = this.target.find('tbody tr td:nth-child(' + (this.column + 1) + ')').toArray();
      var dropdownFilterContent = document.createElement('div');
      dropdownFilterContent.className = 'dropdown-filter-content';
      var innerDivs = this.tds.reduce(function (arr, el) {
        var values = arr.map(function (el) {
          return el.children[0].innerText.trim();
        });
        if (values.indexOf(el.innerText.trim()) < 0) arr.push(el);
        return arr;
      }, []).sort(function (a, b) {
        var A = a.innerText.toLowerCase();
        var B = b.innerText.toLowerCase();
        if (!isNaN(Number(A)) && !isNaN(Number(B))) {
          if (Number(A) < Number(B)) return -1;
          if (Number(A) > Number(B)) return 1;
        } else {
          if (A < B) return -1;
          if (A > B) return 1;
        }
        return 0;
      }).map(function (td, index) {
        var value = td.children[0].innerText;

        if(document.querySelector("#dropdown-filter-dropdown"+colIndex +" #dropdown-filter-item"+index)){
          document.querySelector("#dropdown-filter-dropdown" + colIndex + " #dropdown-filter-item" + index).children[0].value = value.trim().replace(/ +(?= )/g, '');
          document.querySelector("#dropdown-filter-dropdown" + colIndex + " #dropdown-filter-item" + index).children[1].innerHTML = value;
        } else {
          console.log("NEW");
          _this.dropdownFilterItem(td, index, _this);
        }
      });
      //this.th.appendChild(this.menu);
    };
    FilterMenu.prototype.reload2 = function () {
      var filterMenus = filterCollection.filterMenus;
      console.log(filterMenus);
      filterMenus.forEach(function(filtMenu){
        filtMenu.selectAllUpdate(true);
        filtMenu.updateSelectAll();
        var rows = filterCollection.rows;
        var ths = filterCollection.ths;
        //filterCollection.updateRowVisibility(filterMenus, rows, ths);
      });
    }
    FilterMenu.prototype.searchToggle = function (value) {
      if (this.selectAllCheckbox instanceof HTMLInputElement) this.selectAllCheckbox.checked = false;
      if (value.length === 0) {
        this.toggleAll(true);
        if (this.selectAllCheckbox instanceof HTMLInputElement) this.selectAllCheckbox.checked = true;
        return;
      }
      this.toggleAll(false);
      this.inputs.filter(function (input) {
        return input.value.toLowerCase().indexOf(value.toLowerCase()) > -1;
      }).forEach(function (input) {
        input.checked = true;
      });
    };
    FilterMenu.prototype.updateSelectAll = function () {
      if (this.selectAllCheckbox instanceof HTMLInputElement) {
        $(this.searchFilter).val('');
        this.selectAllCheckbox.checked = this.inputs.length === this.inputs.filter(function (input) {
          return input.checked;
        }).length;

        if(!this.selectAllCheckbox.checked){
          $(this.selectAllCheckbox).parent().parent().parent().parent().find(".arrow-down").css("border", "solid white");
          $(this.selectAllCheckbox).parent().parent().parent().parent().find(".arrow-down").css("border-width", "0 3px 3px 0");
          $(this.selectAllCheckbox).parent().parent().parent().parent().find(".arrow-down").parent().css("border", "1.6px solid " + secondaryColor)
          $(this.selectAllCheckbox).parent().parent().parent().parent().find(".arrow-down").parent().css("background-color", secondaryColor)
        } else {
          $(this.selectAllCheckbox).parent().parent().parent().parent().find(".arrow-down").css("border", "solid black");
          $(this.selectAllCheckbox).parent().parent().parent().parent().find(".arrow-down").css("border-width", "0 3px 3px 0");
          $(this.selectAllCheckbox).parent().parent().parent().parent().find(".arrow-down").parent().css("border", "1.6px solid black")
          $(this.selectAllCheckbox).parent().parent().parent().parent().find(".arrow-down").parent().css("background-color", "white")
        }
      }
    };
    FilterMenu.prototype.selectAllUpdate = function (checked) {
      $(this.searchFilter).val('');
      this.toggleAll(checked);
      if(!checked){
        $(this.searchFilter).parent().parent().parent().find(".arrow-down").css("border", "solid white");
        $(this.searchFilter).parent().parent().parent().find(".arrow-down").css("border-width", "0 3px 3px 0");
        $(this.searchFilter).parent().parent().parent().find(".arrow-down").parent().css("border", "1.6px solid " + secondaryColor);
        $(this.searchFilter).parent().parent().parent().find(".arrow-down").parent().css("background-color", secondaryColor);
      } else {
        $(this.searchFilter).parent().parent().parent().find(".arrow-down").css("border", "solid black");
        $(this.searchFilter).parent().parent().parent().find(".arrow-down").css("border-width", "0 3px 3px 0");
        $(this.searchFilter).parent().parent().parent().find(".arrow-down").parent().css("border", "1.6px solid black");
        $(this.searchFilter).parent().parent().parent().find(".arrow-down").parent().css("background-color", "white");
      }
    };
    FilterMenu.prototype.toggleAll = function (checked) {
      for (var i = 0; i < this.inputs.length; i++) {
        var input = this.inputs[i];
        if (input instanceof HTMLInputElement) input.checked = checked;
      }
    };
    FilterMenu.prototype.dropdownFilterItem = function (td, index, self) {
      var value = td.children[0].innerText;
      var dropdownFilterItem = document.createElement('div');
      dropdownFilterItem.className = 'dropdown-filter-item';
      dropdownFilterItem.id = 'dropdown-filter-item'+index;
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.value = value.trim().replace(/ +(?= )/g, '');
      input.setAttribute('checked', 'checked');
      input.className = 'dropdown-filter-menu-item item';
      input.setAttribute('data-column', self.column.toString());
      input.setAttribute('data-index', self.index.toString());
      dropdownFilterItem.appendChild(input);
      dropdownFilterItem.innerHTML = dropdownFilterItem.innerHTML.trim() + ' ' + "<span>" + value + "</span>";
      return dropdownFilterItem;
    };
    FilterMenu.prototype.dropdownFilterItemSelectAll = function () {
      var value = this.options.captions.select_all;
      var dropdownFilterItemSelectAll = document.createElement('div');
      dropdownFilterItemSelectAll.className = 'dropdown-filter-item';
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.value = this.options.captions.select_all;
      input.setAttribute('checked', 'checked');
      input.className = 'dropdown-filter-menu-item select-all';
      input.setAttribute('data-column', this.column.toString());
      input.setAttribute('data-index', this.index.toString());
      dropdownFilterItemSelectAll.appendChild(input);
      dropdownFilterItemSelectAll.innerHTML = dropdownFilterItemSelectAll.innerHTML + ' ' + value;
      return dropdownFilterItemSelectAll;
    };
    FilterMenu.prototype.dropdownFilterSearch = function () {
      var dropdownFilterItem = document.createElement('div');
      dropdownFilterItem.className = 'dropdown-filter-search';
      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'dropdown-filter-menu-search form-control';
      input.setAttribute('data-column', this.column.toString());
      input.setAttribute('data-index', this.index.toString());
      input.setAttribute('placeholder', this.options.captions.search);
      input.addEventListener("keyup", function(event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
          // Cancel the default action, if needed
          event.preventDefault();
          if($('.dropdown-filter-content').is(":visible")) {
            $(this).parent().parent().hide();
            setTableWidth();
          }
        }
      });
      dropdownFilterItem.appendChild(input);
      return dropdownFilterItem;
    };
    FilterMenu.prototype.dropdownFilterSort = function (direction) {
      var dropdownFilterItem = document.createElement('div');
      dropdownFilterItem.className = 'dropdown-filter-sort';
      var span = document.createElement('span');
      span.className = direction.toLowerCase().split(' ').join('-');
      span.setAttribute('data-column', this.column.toString());
      span.setAttribute('data-index', this.index.toString());
      span.innerText = direction;
      dropdownFilterItem.appendChild(span);
      return dropdownFilterItem;
    };
    FilterMenu.prototype.dropdownFilterContent = function () {
      var _this = this;
      var self = this;
      var dropdownFilterContent = document.createElement('div');
      dropdownFilterContent.className = 'dropdown-filter-content';
      var innerDivs = this.tds.reduce(function (arr, el) {
        var values = arr.map(function (el) {
          return el.innerText.trim();
        });
        if (values.indexOf(el.innerText.trim()) < 0) arr.push(el);
        return arr;
      }, []).sort(function (a, b) {
        var A = a.innerText.toLowerCase();
        var B = b.innerText.toLowerCase();
        if (!isNaN(Number(A)) && !isNaN(Number(B))) {
          if (Number(A) < Number(B)) return -1;
          if (Number(A) > Number(B)) return 1;
        } else {
          if (A < B) return -1;
          if (A > B) return 1;
        }
        return 0;
      }).map(function (td, index) {
        return _this.dropdownFilterItem(td, index, self);
      });
      this.inputs = innerDivs.map(function (div) {
        return div.firstElementChild;
      });
      var selectAllCheckboxDiv = this.dropdownFilterItemSelectAll();
      this.selectAllCheckbox = selectAllCheckboxDiv.firstElementChild;
      innerDivs.unshift(selectAllCheckboxDiv);
      var searchFilterDiv = this.dropdownFilterSearch();
      this.searchFilter = searchFilterDiv.firstElementChild;
      var outerDiv = innerDivs.reduce(function (outerDiv, innerDiv) {
        outerDiv.appendChild(innerDiv);
        return outerDiv;
      }, document.createElement('div'));
      outerDiv.className = 'checkbox-container';
      var elements = [];
      if (this.options.sort) elements = elements.concat([this.dropdownFilterSort(this.options.captions.a_to_z), this.dropdownFilterSort(this.options.captions.z_to_a)]);
      if (this.options.search) elements.push(searchFilterDiv);
      return elements.concat(outerDiv).reduce(function (html, el) {
        html.appendChild(el);
        return html;
      }, dropdownFilterContent);
    };
    FilterMenu.prototype.dropdownFilterDropdown = function (index) {
      var dropdownFilterDropdown = document.createElement('div');
      dropdownFilterDropdown.className = 'dropdown-filter-dropdown';
      dropdownFilterDropdown.id += "dropdown-filter-dropdown" + index;
      var arrow = document.createElement('span');
      arrow.className = 'glyphicon glyphicon-arrow-down dropdown-filter-icon';
      var icon = document.createElement('i');
      icon.className = 'arrow-down';
      arrow.appendChild(icon);
      dropdownFilterDropdown.appendChild(arrow);
      dropdownFilterDropdown.appendChild(this.dropdownFilterContent());
      if ($(this.th).hasClass('no-sort')) {
        $(dropdownFilterDropdown).find('.dropdown-filter-sort').remove();
      }
      if ($(this.th).hasClass('no-filter')) {
        $(dropdownFilterDropdown).find('.checkbox-container').remove();
      }
      if ($(this.th).hasClass('no-search')) {
        $(dropdownFilterDropdown).find('.dropdown-filter-search').remove();
      }
      return dropdownFilterDropdown;
    };
    return FilterMenu;
  }();

  var FilterCollection = function () {
    function FilterCollection(target, options) {
      this.target = target;
      this.options = options;
      this.ths = target.find('th' + options.columnSelector).toArray();
      this.filterMenus = this.ths.map(function (th, index) {
        var column = $(th).index();
        return new FilterMenu(target, th, column, index, options);
      });
      this.rows = target.find('tbody').find('tr').toArray();
      this.table = target.get(0);
    }
    FilterCollection.prototype.initialize = function () {
      this.filterMenus.forEach(function (filterMenu, index) {
        filterMenu.initialize(index);
      });
        this.bindCheckboxes();
        this.bindSelectAllCheckboxes();
        this.bindSort();
        this.bindSearch();
    };
    FilterCollection.prototype.bindCheckboxes = function () {
      var filterMenus = this.filterMenus;
      var rows = this.rows;
      var ths = this.ths;
      var updateRowVisibility = this.updateRowVisibility;
      this.target.find('.dropdown-filter-menu-item.item').change(function () {
        var index = $(this).data('index');
        var value = $(this).val();
        filterMenus[index].updateSelectAll();
        updateRowVisibility(filterMenus, rows, ths);
      });
    };
    FilterCollection.prototype.bindSelectAllCheckboxes = function () {
      var filterMenus = this.filterMenus;
      var rows = this.rows;
      var ths = this.ths;
      var updateRowVisibility = this.updateRowVisibility;
      this.target.find('.dropdown-filter-menu-item.select-all').change(function () {
        var index = $(this).data('index');
        var value = this.checked;
        filterMenus[index].selectAllUpdate(value);
        updateRowVisibility(filterMenus, rows, ths);
      });
    };
    FilterCollection.prototype.bindSort = function () {
      var filterMenus = this.filterMenus;
      var rows = this.rows;
      var ths = this.ths;
      var sort = this.sort;
      var table = this.table;
      var options = this.options;
      var updateRowVisibility = this.updateRowVisibility;
      this.target.find('.dropdown-filter-sort').click(function () {
        var $sortElement = $(this).find('span');
        var column = $sortElement.data('column');
        var order = $sortElement.attr('class');
        sort(column, order, table, options);
        updateRowVisibility(filterMenus, rows, ths);
      });
    };
    FilterCollection.prototype.bindSearch = function () {
      var filterMenus = this.filterMenus;
      var rows = this.rows;
      var ths = this.ths;
      var updateRowVisibility = this.updateRowVisibility;
      this.target.find('.dropdown-filter-search').keyup(function () {
        var $input = $(this).find('input');
        var index = $input.data('index');
        var value = $input.val();
        if(value !== ""){
          $(this).parent().parent().find(".arrow-down").css("border", "solid white");
          $(this).parent().parent().find(".arrow-down").css("border-width", "0 3px 3px 0");
          $(this).parent().parent().find(".arrow-down").parent().css("border", "1.6px solid " + secondaryColor)
          $(this).parent().parent().find(".arrow-down").parent().css("background-color", secondaryColor)
        } else {
          $(this).parent().parent().find(".arrow-down").css("border", "solid black");
          $(this).parent().parent().find(".arrow-down").css("border-width", "0 3px 3px 0");
          $(this).parent().parent().find(".arrow-down").parent().css("border", "1.6px solid black")
          $(this).parent().parent().find(".arrow-down").parent().css("background-color", "white");
        }
        filterMenus[index].searchToggle(value);
        updateRowVisibility(filterMenus, rows, ths);
      });
    };
    FilterCollection.prototype.updateRowVisibility = function (filterMenus, rows, ths) {
      var showRows = rows;
      var hideRows = [];
      var selectedLists = filterMenus.map(function (filterMenu) {
        return {
          column: filterMenu.column,
          selected: filterMenu.inputs.filter(function (input) {
            return input.checked;
          }).map(function (input) {
            return input.value.trim().replace(/ +(?= )/g, '');
          })
        };
      });
      for (var i = 0; i < rows.length; i++) {
        var tds = rows[i].children;
        for (var j = 0; j < selectedLists.length; j++) {
          var content = tds[selectedLists[j].column].innerText.trim().replace(/ +(?= )/g, '');
          if (selectedLists[j].selected.indexOf(content) === -1) {
            $(rows[i]).hide();
            break;
          }
          $(rows[i]).show();
        }
      }
    };
    FilterCollection.prototype.sort = function (column, order, table, options) {
      var flip = 1;
      if (order === options.captions.z_to_a.toLowerCase().split(' ').join('-')) flip = -1;
      var tbody = $(table).find('tbody').get(0);
      var rows = $(tbody).find('tr').get();
      rows.sort(function (a, b) {
        var A = a.children[column].innerText.toUpperCase();
        var B = b.children[column].innerText.toUpperCase();
        if (!isNaN(Number(A)) && !isNaN(Number(B))) {
          if (Number(A) < Number(B)) return -1 * flip;
          if (Number(A) > Number(B)) return 1 * flip;
        } else {
          if (A < B) return -1 * flip;
          if (A > B) return 1 * flip;
        }
        return 0;
      });
      for (var i = 0; i < rows.length; i++) {
        tbody.appendChild(rows[i]);
      }
    };
    return FilterCollection;
  }();

  $$1.fn.excelTableFilter = function (options) {
    var target = this;
    options = $$1.extend({}, $$1.fn.excelTableFilter.options, options);
    if (typeof options.columnSelector === 'undefined') options.columnSelector = '';
    if (typeof options.sort === 'undefined') options.sort = true;
    if (typeof options.search === 'undefined') options.search = true;
    if (typeof options.captions === 'undefined') options.captions = {
      a_to_z: 'Ordenar de A a Z',
      z_to_a: 'Ordenar de Z a A',
      search: 'Buscar',
      select_all: '(Seleccionar todo)'
    };
    filterCollection = new FilterCollection(target, options);
    filterCollection.initialize();
    return target;
  };
  $$1.fn.excelTableFilter.options = {};

}(jQuery));
