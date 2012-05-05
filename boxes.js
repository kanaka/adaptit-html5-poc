var next_pile_idx = 0, next_strip_idx = 0,
    pile_edit = null;

function create_pile(source_text, target_text) {
    var pile, source, target;

    pile = document.createElement('div');
    pile.id = "pile-" + next_pile_idx;
    pile.className = "pile";
    next_pile_idx++;

    source = document.createElement('div'),
    source.className = 'source';
    source.innerText = source_text;
    pile.appendChild(source);

    target = document.createElement('div'),
    target.className = 'target';
    target.innerText = target_text;
    pile.appendChild(target);

    return pile;
}

function create_strip(into, title, word_string) {
    var id = "strip-" + next_strip_idx,
        strip, header, pile,
        i, words = word_string.split(' ');

    strip = document.createElement('div');
    strip.id = id;
    strip.className = "strip";
    next_strip_idx++;

    header = document.createElement('div');
    header.id = id + "-header";
    header.className = "strip-header";
    header.innerText = title;
    strip.appendChild(header);

    for (i = 0; i < words.length; i++) {
        var pile = create_pile(words[i], "*" + words[i] + "*");
        strip.appendChild(pile);
    }

    document.getElementById(into).appendChild(strip);

    // Activate select list for this strip
    strip.selectlist = SelectList('#' + id + ' .pile',
                                  'ui-selecting',
                                  'ui-selected',
                                  {callback: handle_select,
                                   longclick_time: 333});
}

function edit (pile) {
    var strip = pile.parentElement,
        src = $('.source', pile)[0],
        stext = src.innerText,
        tgt = $('.target', pile)[0],
        ttext = tgt.innerText;

    console.log("editing " + pile.id);

    // Save the target text
    
    // If existing edit box, then blur it first
    if (pile_edit) {
        pile_edit.blur();
    }

    pile_edit = document.createElement('input');
    pile_edit.type = "text";
    pile_edit.value = ttext;
    pile_edit.size = stext.length + 2;
    pile_edit.addEventListener("keydown", function (event) {
        if ((event.keyCode === 9) ||
            (event.keyCode === 13)) {
            // If tab/enter is pressed, blur and move to edit the next pile
            pile_edit.blur();
            Util.stopEvent(event);

            var next_pile = pile.nextSibling;
            console.log("next sibling: " + next_pile.id);
            if (next_pile) {
                // Do it in new context
                setTimeout(function () { edit(next_pile); }, 10);
            }
        }
    }, false);
    pile_edit.onblur = function () {
        // Reset the input box to plain text
        var new_ttext = pile_edit.value;

        tgt.removeChild(pile_edit);
        tgt.innerText = new_ttext;
        pile_edit.onblur = null;
        pile_edit = null;

    }

    // Replace the text with the input area
    tgt.innerText = "";
    tgt.appendChild(pile_edit);

    // Delay so that input is visible before focus (needed for iOS
    // keyboard)
    setTimeout(function () {
        // Select and focus on the box
        console.dir(pile_edit);
        pile_edit.focus();
        pile_edit.select();
    }, 10);
}

function handle_select(selected, dblclick, longclick) {
    //console.log(">> handle_select: " + selected.length);

    var strip = selected[0].parentElement;

    if (pile_edit) {
        pile_edit.blur();
    }

    if (selected.length === 1) {
        if (longclick) {
            // Long click to edit pile
            
            edit(selected[0]);

        } else if (dblclick) {
            // Split one pile

            var cur_box = selected[0], new_box,
                strip = cur_box.parentElement,
                src = $('#' + cur_box.id + " .source")[0],
                swords = src.innerText.split(" "),
                tgt = $('#' + cur_box.id + " .target")[0];

            // Split based on source words
            // Put all target words in the first pile
            if (swords.length > 1) {
                src.innerText = swords[0];

                for (i = swords.length - 1; i > 0; i--) {
                    new_box = create_pile(swords[i], "");
                    strip.insertBefore(new_box, cur_box.nextSibling);
                }
            }
        } else if (!dblclick) {
            // Single pile clicked/selected

            console.log("Selected " + selected[0].id);

        }

    } else if (selected.length > 1) {
        // Join multiple piles

        var first = selected[0],
            smsg, tmsg, new_pile;

        // Join source and target words into one new pile
        smsg = $.map(selected, function (o) { return $("#" + o.id + " .source").text(); }).join(" ");
        tmsg = $.map(selected, function (o) { return $("#" + o.id + " .target").text(); }).join(" ");

        new_pile = create_pile(smsg, tmsg);
        $(first).before(new_pile);

        // Remove all prior selected piles
        for (i = 0; i < selected.length; i++ ) {
            strip.removeChild(selected[i]);
        }

    }

    if (selected.length !== 1) {
        this.clear();
    }
}


$(document).ready(function() {
    var v;

    for (v = 1; v <= source_text.verses; v++) {
        var strip = create_strip("chapter", v, source_text[v]);
    }
});
