(function() {
    var filters = {
        Time: function(value){
            var date = new Date(1970,0,1);
            date.setSeconds(value);
            return _.fmtDate(date, 'i:s');
        },
        Percent: function(value) {
            return _.toInt(value*100) + '%';
        }
    };
    $(document).on('click submit change','[data-trigger]', function(){
        var $target = $(this);
        $target.trigger($target.data('trigger'), $target.data());
        return false;
    });
    $(document).on('mousemove change', '[data-display]', function(event){
        var source = $(event.target);
        var label = $('label[for="'+source.attr('id')+'"]');
        var display = label.find('span');
        if(!display.length) {
            display = $('<span>');
            label.append(display);
        }
        var filterName = source.data('display');
        display.html(filters[filterName](source.val()));
    });

    $(document).on('focus', '[data-picker]', function(event){
        $(event.target).pickTime();
    });

    $(document).on('set', function(event){
        var $this = $(event.target),
            $target = $($this.data('target')),
            value = $this.data('value');
        $target.val(value);
        $target.change();
    });


}.call(this.global || this.window || global || window));

function drawClock(timePickerTable, options, onSelect) {
    options = options || {};
    options.start = _.toInt(options.start);
    options.step = _.toInt(options.step, 1);
    options.value = _.toInt(options.value, options.start-1);
    timePickerTable.empty();
    var callback = function() {
        onSelect($(this).data('value'));
    };
    for(var i=options.start; i<(options.start+12); i++) {
        var value = options.start + options.step*i;
        var number = $('<div>',{
            'class': 'time-picker-number mdl-js-button mdl-button--raised mdl-js-ripple-effect',
            'html': value,
            'data-value': value
        });
        timePickerTable.append(number);
        number.on('click', callback);
        if (options.value>=options.start && value == options.value) {
            number.addClass('active');
        }
    }
}

function setValueDisplayTime(timePickerDisplayTime, id, value) {
    value = _.fmtNumber(value,2);
    $(timePickerDisplayTime[id]).html(value);
    return value;
}

function setActiveDisplayTime(timePickerDisplayTime, id) {
    timePickerDisplayTime.removeClass('active');
    $(timePickerDisplayTime[id]).addClass('active');
}

function pickTime(timePicker, id, step, value) {
    return new Promise(function(resolve){
        var timePickerTable = timePicker.find('.time-picker-table');
        var timePickerDisplayTime = timePicker.find('.time-picker-display-time');
        setActiveDisplayTime(timePickerDisplayTime, id);
        drawClock(timePickerTable, { step: step, value: value }, function(value) {
            setValueDisplayTime(timePickerDisplayTime, id, value);
            resolve(value);
        });
    });
}


$.fn.pickTime = function() {
    var $timePicker = $('#time-picker');
    var $this = $(this);
    var format = $this.data('picker');
    var timePickerDisplayTime = $timePicker.find('.time-picker-display-time');
    var values = $(this).val().split(':').map(function(value, id){
        return setValueDisplayTime(timePickerDisplayTime, id, value);
    });
    pickTime($timePicker, 0, 1, values[0]).then(function(hours){
        return pickTime($timePicker, 1, 5, values[1]).then(function(minutes){
            return pickTime($timePicker, 2, 5, values[2]).then(function(seconds){
                return new Date(0,0,0, hours, minutes, seconds);
            })
        })
    }).then(function(date){
        $this.val(_.fmtDate(date, format));
        $this.change();
        $timePicker.modal('hide');
    });
    $timePicker.modal('show');
};

$(function(){
    $('[data-display]').change();
});