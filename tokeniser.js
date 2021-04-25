const tokenRegex = {
    turnstyle: /^(\|-|⊢)/,
    comma: /^(,)/,
    implies: /^(->|implies|→)/,
    or: /^(\||or|∨)/,
    and: /^(&|and|∧)/,
    not: /^(not|-|¬)/,
    open_parentheses: /^(\()/,
    close_parentheses: /^(\))/,
    atom: /^([a-z]|_)(_|[a-z]|[0-9])*/,
}

function tokenise(program) {
    return getNextToken(program.toLowerCase().trim());
}

function getNextToken(string) {
    if (string.length == 0) {
        return [{ type: 'EOF' }]
    }

    let token = {
        type: "undefined",
    };
    for (key in tokenRegex) {
        let match = string.match(tokenRegex[key]);
        if (match) {
            token = {
                type: key,
                value: match[0].trim(),
            }
            break;
        }
    }
    if (token.type != 'undefined') {
        return [token, ...getNextToken(string.slice(token.value.length).trim())];
    } else {
        console.log("ERROR: Undefined Token: " + string);
        return [];
    }
}


module.exports = tokenise;