/**
 * Calcula z-index do card para que badges de colapso (abaixo do card)
 * fiquem acima dos cards posicionados mais embaixo na tela.
 */
export function getNodeStackZ(
  position,
  { selected = false, collapsed = false, hasChildren = false } = {}
) {
  const y = position?.y ?? 0;
  const x = position?.x ?? 0;

  let z = 500 - Math.floor(y / 10) - Math.floor(x / 10000);
  if (collapsed && hasChildren) z += 150;
  if (selected) z += 300;

  return Math.max(1, Math.min(650, z));
}
