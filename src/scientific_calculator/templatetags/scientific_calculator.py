from django import template


register = template.Library()


@register.inclusion_tag("scientific_calculator/calculator.html")
def scientific_calculator():
    return {}
