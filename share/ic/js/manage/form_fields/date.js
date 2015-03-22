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

YUI.add(
    "ic-manage-formfield-date",
    function(Y) {
        var DateField;

        DateField = function (config) {
            DateField.superclass.constructor.apply(this, arguments);
        }

        DateField.NAME = 'ic_manage_formfield_date';

        Y.extend (
            DateField,
            Y.TextField,
            {
// recovering some whitespace...

    _calendar: null,

    renderUI: function() {
        DateField.superclass.renderUI.apply(this, arguments);
        var calendar_node, cid;

        calendar_node = Y.Node.create('<div></div>');
        cid = Y.guid();
        calendar_node.set('id', cid);

        this.get('contentBox').appendChild(calendar_node);
        var config = this._getConfigFromValue();
        this._massageConfig(config);
        this._calendar = new Y.Calendar(cid, config);
    },

    bindUI: function () {
        this._calendar.on('select', Y.bind(function (d) {
            this._setValue(d);
        }, this));
        this._fieldNode.on('focus', Y.bind(function () {
            this._calendar.show();
        }, this));
    },

    _setValue: function (d) {
        // Y.log('date::_setValue');
        var date_str;
        date_str = d.getFullYear() + '-' + (d.getMonth() + 1) +
            '-' + d.getDate();
        this._fieldNode.set('value', date_str);
        this._calendar.hide();
    },

    _getConfigFromValue: function () {
        // 2009-11-30T11:01:00
        var matches = this.get('value').match(/(\d{4})-(\d{2})-(\d{2})(T(\d{2}):(\d{2}):(\d{2}))?/);
        var year = matches[1];
        var month = matches[2];
        var day = matches[3];
        var withtime = matches[4] ? true : false;
        var hours = matches[5];
        var mins = matches[6];
        var secs = matches[7];
        /*
        Y.log('withtime: ' + withtime);
        Y.log('year=' + year + ', month=' + month + ', day=' + day + ', hours=' +
              hours + ', mins=' + mins + ', secs=' + secs);
        */
        var date = new Date(year, month-1, day, hours, mins, secs);
        return { withtime: withtime, date: date }
    },

    _massageConfig: function (config) {
        config.withtime = false;
    }

// ...whitespace returned
            }
        );

        Y.namespace("IC");
        Y.IC.DateField = DateField;

    },
    "@VERSION@",
    {
        requires: [
            "gallery-calendar",
            "gallery-form"
        ]
    }
);

