/*
GRAMMAR

<sequent> = <premises> |- <expression>
<premises> = empty | <premises_list>
<premises_list> = <expression> | <expression>,<premises_list>

<expression> = <or_exp> | <or_exp> implies <expression>
<or_exp> = <and_exp> | <and_exp> or <or_exp>
<and_exp> = <not_exp> | <not_exp> and <and_exp>
<not_exp> = not <brackets_exp> | <brackets_exp>
<brackets_exp> = (<expression>) | <atom>
<atom> = p | q | r | s 
*/

const tokenise = require("./tokeniser");

function parse(sequent) {
    const tokens = tokenise(sequent);
    const parsedSequent = parseSequent(tokens);
    return parsedSequent;
}

function parseSequent(tokens) {
    const premises = parsePremises(tokens);
    const turnStyle = tokens.shift();
    if (turnStyle.type != 'turnstyle') throw Error("Invalid Expression: turnstyle expected");
    const conclusion = parseExpression(tokens);
    const eof = tokens.shift();
    if (eof.type != 'EOF') throw Error("Invalid Expression: EOF expected");
    return { premises, conclusion }
}

function parsePremises(tokens) {
    if (tokens[0].type == 'turnstyle') return [];
    return parsePremisesList(tokens);
}

function parsePremisesList(tokens) {
    const expression = parseExpression(tokens);
    if (tokens[0].type == 'comma') {
        tokens.shift();
        const remainingPremises = parsePremisesList(tokens);
        return [expression, ...remainingPremises];
    } else {
        return [expression];
    }
}

function parseExpression(tokens) {
    const orExp = parseOrExp(tokens);
    if (tokens[0].type == 'implies') {
        tokens.shift();
        const exp = parseExpression(tokens);
        return { type: "implies", left: orExp, right: exp };
    } else {
        return orExp;
    }
}

function parseOrExp(tokens) {
    const andExp = parseAndExp(tokens);
    if (tokens[0].type == 'or') {
        tokens.shift();
        const exp = parseOrExp(tokens);
        return { type: "or", left: andExp, right: exp };
    } else {
        return andExp;
    }
}

function parseAndExp(tokens) {
    const notExp = parseNotExp(tokens);
    if (tokens[0].type == 'and') {
        tokens.shift();
        const exp = parseAndExp(tokens);
        return { type: "and", left: notExp, right: exp };
    } else {
        return notExp;
    }
}

function parseNotExp(tokens) {
    if (tokens[0].type == 'not') {
        tokens.shift();
        const exp = parseBracketsExp(tokens);
        return { type: "not", exp: exp };
    } else {
        return parseBracketsExp(tokens);
    }
}

function parseBracketsExp(tokens) {
    if (tokens[0].type == 'atom') {
        return parseAtom(tokens);
    } else {
        const open = tokens.shift();
        if (open.type != 'open_parentheses') throw Error("Syntax Error: open parens expected");
        const exp = parseExpression(tokens);
        const close = tokens.shift();
        if (close.type != 'close_parentheses') throw Error("Syntax Error: close parens expected");
        return exp;
    }
}

function parseAtom(tokens) {
    if (tokens[0].type == 'atom') {
        const t = tokens.shift();
        return { type: 'atom', value: t.value };
    } else {
        throw Error("Syntax Error: atom expected");
    }
}



module.exports = parse;