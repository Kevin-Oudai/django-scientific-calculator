from django import template


register = template.Library()


@register.inclusion_tag("scientific_calculator/calculator.html")
def scientific_calculator(brand=None, layout=None):
    """Render the physical layout, with an optional escaped consumer brand."""
    if layout not in (None, "physical", "legacy"):
        raise ValueError("Calculator layout must be physical or legacy")
    context = {}
    if brand is not None:
        context["calculator_brand"] = str(brand)
    if layout is not None:
        context["layout"] = layout
    return context
