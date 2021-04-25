function formatSequent(expression, shortForm) {
    let str = "";
    str += formatPremises(expression.premises, shortForm);
    str += " ⊢ ";
    str += formatExpression(expression.conclusion, shortForm);
    return str;
}

function formatPremises(premises, shortForm) {
    return premises.map(exp => formatExpression(exp, shortForm)).join(", ");
}

function formatExpression(exp, shortForm) {
    if (exp.type == 'implies') return formatOrExp(exp.left, shortForm) + (shortForm ? ' → ' : ' implies ') + formatExpression(exp.right, shortForm);
    return formatOrExp(exp, shortForm);
}

function formatOrExp(exp, shortForm) {
    if (exp.type == 'or') return formatAndExp(exp.left, shortForm) + (shortForm ? ' ∨ ' : ' or ') + formatOrExp(exp.right, shortForm);
    return formatAndExp(exp, shortForm);
}

function formatAndExp(exp, shortForm) {
    if (exp.type == 'and') return formatNotExp(exp.left, shortForm) + (shortForm ? ' ∧ ' : ' and ') + formatAndExp(exp.right, shortForm);
    return formatNotExp(exp, shortForm);
}

function formatNotExp(exp, shortForm) {
    if (exp.type == 'not') return (shortForm ? '¬' : 'not ') + formatBracketsExp(exp.exp, shortForm);
    return formatBracketsExp(exp, shortForm);
}

function formatBracketsExp(exp, shortForm) {
    if (exp.type == 'atom') return exp.value;
    return '(' + formatExpression(exp, shortForm) + ')';
}

module.exports = { formatSequent, formatExpression }