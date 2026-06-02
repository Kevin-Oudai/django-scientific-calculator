# Versions

## 0.2.2

Fixes fraction-template navigation and fraction bar styling.

- Right arrow exits a filled denominator and places the main cursor after the inserted fraction.
- Operators can be entered immediately after completing a fraction template.
- Fraction bars only apply to the fraction's direct numerator and denominator cells, avoiding extra lines under nested operators.

## 0.2.1

Improves exact fraction entry and result rotation.

- The `b/c` button opens an editable stacked fraction template.
- Arrow controls move between numerator and denominator while editing the template.
- Result rotation includes exact/surd form when the value has one.

## 0.2.0

Adds Additional Mathematics surd behavior.

- Displays simplified square root answers as exact surds, such as `sqrt(24) = 2√6`.
- Displays common DEG trig answers exactly, such as `sin(60) = √3/2`.
- Renders exact surd fractions with stacked numerator and denominator layout.
- Adds desktop Playwright coverage for surd simplification and exact trig output.

## 0.1.0

Initial reusable package baseline.

- Packages only the `scientific_calculator` Django app.
- Includes calculator template, CSS, and JavaScript in the pip package.
- Supports Django 5.2.
- Includes a Dockerized local demo project.
- Includes desktop Playwright tests for calculator UI functions.
