/*
    Copyright (C) 2008-2010 End Point Corporation, http://www.endpoint.com/

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program. If not, see: http://www.gnu.org/licenses/
*/

YUI.add("ic-manage-widget-function-expandable-list", function (Y) {

    Y.IC.ManageFunctionExpandableList = Y.Base.create(
        "ic_manage_function_expandable_list",           // module identifier
        Y.IC.ManageFunctionList,                        // what to extend
        [],                                             // classes to mix in
        {                                               // overrides/additions

        _fitted: false,
        _rows: null,

        _bindDataTableEvents: function () {
            // Y.log('expandable_list::_bindDataTableEvents');
            Y.IC.ManageFunctionExpandableList.superclass._bindDataTableEvents.call(this);
            if (this.get('expandable')) {
                this._data_table.on(
                    'cellClickEvent',
                    this._data_table.onEventToggleRowExpansion);
            }
        },

        _initDataTableFormaters: function () {
            var expansionFormatter = function(el, oRecord, oColumn, oData) {
                var cell_element = el.parentNode;
                //Set trigger
                if (oData) { //Row is closed
                    Y.one(cell_element).addClass("yui-dt-expandablerow-trigger");
                }
                el.innerHTML = oData;
            };

            if (this.get('expandable')) {
                Y.each(this._meta_data.data_table_column_defs, function (v, i, ary) {
                    if (v.key === '_options') {
                        v.formatter = expansionFormatter;
                    }
                });
            }
        },

        _adjustDataTableConfig: function (data_table_config) {
            data_table_config.rowExpansionTemplate = this.expansionTemplate;
            data_table_config.selectionMode = 'single';
            data_table_config.initialLoad = false;
        },

        _initDataTable: function (data_table_config) {
            // Y.log('expandable_list::_initDataTable');
            // Y.log(this._data_source);
            var YAHOO = Y.YUI2;

            this._data_table = new YAHOO.widget.RowExpansionDataTable(
                this.get('code'),
                this._meta_data.data_table_column_defs,
                this._data_source,
                data_table_config
            );

            this._data_table.showTableMessage(
                this._data_table.get("MSG_LOADING"),
                YAHOO.widget.DataTable.CLASS_LOADING
            );
        },

        _sendDataTableRequest: function (state) {
            // Y.log('expandable_list::_sendDataTableRequest');
            Y.IC.ManageFunctionExpandableList.superclass
                ._sendDataTableRequest.apply(this, arguments);
            var new_req = Y.QueryString.stringify(state);
            if (new_req !== this._prev_req) {
                this._fitted = false;
            }
        },

        _updateDataTableRecords: function (oRequest, oResponse, oPayload) {
            // Y.log('expandable_list::_updateDataTableRecords');
            Y.IC.ManageFunctionExpandableList.superclass
                ._updateDataTableRecords.apply(this, arguments);
            if (this._has_data) {
                this.fitToContainer();
            }
        },

        hide: function () {
            // Y.log('expandable_list::hide - setting has_data and fitted to false');
            Y.IC.ManageFunctionExpandableList.superclass
                .hide.apply(this, arguments);
            this._has_data = false;
            this._fitted = false;
        },

        show: function () {
            // Y.log('expandable_list::show - fitted:' + this._fitted);
            Y.IC.ManageFunctionExpandableList.superclass
                .show.apply(this, arguments);
            if (!this._fitted) {
                this.fitToContainer();
            }
        },

        fitToContainer: function (container) {
            // Y.log('expandable_list::fitToContainer');
            var dt = this._data_table;
            if (dt) {
                if (!container) {
                    // looking for the layout unit,
                    //  can get it from the ManageContainer
                    var mc = this.get('boundingBox')
                        .ancestor('div.yui3-ic_manage_container');
                    var widget = Y.Widget.getByNode(mc);
                    if (widget)
                        container = widget.get('layout_unit');
                    else
                        return;
                }

                // make sure the table columns have final widths
                dt.validateColumnWidths();

                // get ready to do some height calcs
                var dt_node = this.get('contentBox')
                    .one('div.yui-dt-scrollable');
                var dt_height = dt_node.get('region').height;
                var unit_body = Y.one(container.get('wrap'))
                    .one('div.yui-layout-bd');
                var unit_height = unit_body.get('region').height;
                var magic = 58; // table header + paginator height?
                var total_recs = this._meta_data.total_objects;
                var tr = Y.one(dt.getFirstTrEl());
                var delta_height, row_height, new_height;

                // make sure there is a table
                if (!tr) {
                    this._fitted = false;
                    new_height = unit_height;
                    dt.set('height', (new_height - magic) + 'px');
                    // Y.log('exited, no table to work with');
                    return;
                }

                // there are two possibilities.
                // the table is either to tall or too short.

                // but first, check to make sure it's worth it
                delta_height = Math.abs(dt_height - unit_height);
                row_height = tr.get('region').height;
                var num_recs = this._data_table.getRecordSet().getLength();
                if (Number(this.get('state.results')) === this._rows &&
                    delta_height < row_height) {
                    this._fitted = true;
                    // Y.log('exited, not worth the trouble');
                    return;
                }

                // then tackle the too tall problem
                if (dt_height > unit_height) {
                    // Y.log('shrink the table to fit');
                    dt.set('height', (unit_height - magic) + 'px');
                    bd_height = dt_node.one('div.yui-dt-bd')
                        .get('region').height;
                    this._rows = Math.round(bd_height / row_height);
                    this._getNewRecords();
                }

                // or it's too small and needs to expand
                else if (dt_height < unit_height) {
                    // Y.log('not as big as my unit, try to expand');
                    var prev_rows = this._rows;
                    this._rows = Math.round(
                        (unit_height - magic) / row_height
                    );
                    if (this._rows > total_recs) {
                        this._rows = total_recs;
                    }
                    new_height = (this._rows * row_height) + magic;
                    if (new_height > unit_height) {
                        new_height = unit_height;
                    }
                    dt.set('height', (new_height - magic) + 'px');

                    // so i've set a new height, but i may not have
                    // enought records to fill that space
                    if (prev_rows < total_recs) {
                        this._getNewRecords();
                    }
                }

                else {
                    // Y.log('notifying history with no change.');
                    this._notifyHistory();
                }
            }
        },

        _getNewRecords: function () {
            // if there's a selected record,
            //  calculate the recordOffset so that it
            //  becomes the top row of the new page
            var state = this.get('state');
            var offset = state.startIndex || 0;
            var srow = this._data_table.getSelectedRows()[0];
            if (srow) {
                var ri = this._data_table.getRecordIndex(srow);
                offset = Math.floor(ri / this._rows) * this._rows;
            }
            state.results = this._rows;
            state.startIndex = offset;
            this.setNewPaginator(this._rows, offset);
            this._notifyHistory();
            this._sendDataTableRequest(state);
        },

		/**
		 * This "expansionTemplate" function will be passed to the
		 * "rowExpansionTemplate" property of the YUI DataTable to
		 * enable the row expansion feature. It is passed an arguments
		 * object which contains context for the record that has been
		 * expanded as well as the newly created row.
		 **/
		expansionTemplate: function(o) {
            var _options = Y.Node.create(o.data.getData('_options'));
            // everything below is repeated from container.js - not at all dry...
            var matches    = _options.get("id").match("^([^-]+)-([^-]+)(?:-([^-]+)-(.+))?$");
            var kind       = matches[2] || '';
            var sub_kind   = matches[3] || '';
            var addtl_args = matches[4] || '';
            var config = {
                kind: kind,
                sub_kind: sub_kind,
                args: addtl_args
            };
            var splits = config.args.split("-", 2);
            var code = splits[0];
            var addtl_args = splits[1] + "";
            var widget = new Y.IC.ManageFunctionDetail(
                {
                    code: code,
                    addtl_args: addtl_args
                }
            );
            widget.render(o.liner_element);
         }
    },
    {
        NAME: 'ic_manage_widget_function_expandable_list',
        ATTRS : {
            expandable: {
                value: true
            }
        }
    });
},
    "@VERSION@",
    {
        requires: [
            "ic-manage-widget-function-list",
            "ic-manage-widget-function-detail",
            "base-base",
            "rowexpansion"
        ]
    }
);

