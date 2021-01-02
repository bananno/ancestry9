{
  name // name of the attribute

  // TYPE OF VALUE (use one)

  type // options: String, Boolean, Number

  specialType // options: tags, location, date

  references // the name of another model

  // OTHER DATA FORMAT

  isArray

  defaultValue

  // OPTIONS FOR EDITING THE VALUE

  inputType // options: textarea, toggle; default: text

  showInEditTable // default true

  valueNames // for type:number + inputType:toggle, a list of strings to show instead of integer

  maxValue // for type:number + inputType:toggle, the max value before returning to 0

  // optional methods

  onAdd
  onDelete
  onlyEditableIf
  onlyShareableIf

  // OTHER

  includeInSchema // default true

  includeInExport

}
