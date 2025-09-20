class IgnoreNextLineDirective {
  ignoreLineNumbers = [];
  directive = "vueI18n-ignore-next-line";

  collectIgnoreNextLineDirective(path) {
    const node = path.node;
    if (!node.leadingComments) return;

    // 检查每条注释
    node.leadingComments.forEach((comment) => {
      const commentText = comment.value.trim();

      // 检查是否是指令注释
      if (commentText.startsWith(`${this.directive}`)) {
        const lineNumber = node.loc.start.line;
        this.ignoreLineNumbers.push(lineNumber);
      }
    });
  }

  hasLineNumber(lineNumber) {
    return this.ignoreLineNumbers.includes(lineNumber);
  }
  isIgnoreLine(path) {
    const node = path.node;
    const lineNumber = node.loc && node.loc.start.line;

    if (!lineNumber) return;

    return this.hasLineNumber(lineNumber);
  }
}

class IgnoreVueTemplateNextLineDirective {
  ignoreLineNumbers = [];
  directive = "vueI18n-ignore-next-line";

  collectIgnoreNextLineDirective(node) {
    const commentText = node.content.trim();

    if (!commentText) return;

    if (commentText === this.directive) {
      const lineNumber = node.loc.start.line;
      this.ignoreLineNumbers.push(lineNumber + 1);
    }
  }

  hasLineNumber(lineNumber) {
    return this.ignoreLineNumbers.includes(lineNumber);
  }
  isIgnoreLine(node) {
    const lineNumber = node.loc && node.loc.start.line;

    if (!lineNumber) return;

    return this.hasLineNumber(lineNumber);
  }
}

module.exports = {
  IgnoreNextLineDirective,
  IgnoreVueTemplateNextLineDirective
};
