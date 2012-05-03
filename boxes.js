var next_pile_idx = 0, next_strip_idx = 0;

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
    SelectList('#' + id + ' .pile',
               'ui-selecting', 'ui-selected',
               handle_select);

}

function handle_select(selected, dblclick) {
    //console.log(">> handle_select: " + selected.length);

    var strip = selected[0].parentElement;

    if (selected.length === 1 && !dblclick) {
        // Single element clicked/selected
        console.log("Selected " + selected[0].id);
    } else if (selected.length === 1 && dblclick) {
        // Split

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

    } else if (selected.length > 1) {
        // Join
        var first = selected[0],
            smsg, tmsg;

        // Join source and target words into one new pile
        smsg = $.map(selected, function (o) { return $("#" + o.id + " .source").text(); }).join(" ");
        tmsg = $.map(selected, function (o) { return $("#" + o.id + " .target").text(); }).join(" ");

        $(first).before(create_pile(smsg, tmsg));

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
