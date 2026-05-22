import fs from 'fs';
const file = 'src/components/Toolbar/FilterPopover.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /<div key=\{idx\} className="flex items-center gap-2">/;

const replacement = `<div key={idx} className="flex items-center gap-2">
                      {idx === 0 && <span className="text-xs font-semibold w-12 shrink-0 text-foreground/70">Where</span>}
                      {idx === 1 && (
                        <Select.Root 
                          value={currentView?.filterJoinOperator || 'and'} 
                          onValueChange={(v) => updateView(activeViewId!, { filterJoinOperator: v })}
                        >
                          <Select.Trigger className="w-16 flex items-center justify-between px-2 py-1.5 rounded-md border border-primary/20 bg-background text-[rgb(var(--text-color))] text-xs font-semibold focus:outline-none shrink-0">
                            <Select.Value />
                            <Select.Icon><ChevronDown size={14} className="opacity-50" /></Select.Icon>
                          </Select.Trigger>
                          <Select.Portal>
                            <Select.Content position="popper" sideOffset={4} className="z-[60] overflow-hidden bg-[rgb(var(--bg-color))] rounded-lg border border-primary/20 shadow-xl w-24">
                              <Select.Viewport className="p-1">
                                <Select.Item value="and" className="relative flex items-center gap-2 px-6 py-1.5 text-xs text-[rgb(var(--text-color))] rounded-md cursor-pointer select-none data-[highlighted]:bg-[#2135a6] data-[highlighted]:text-white outline-none">
                                  <Select.ItemIndicator className="absolute left-1"><Check size={12} /></Select.ItemIndicator>
                                  <Select.ItemText>And</Select.ItemText>
                                </Select.Item>
                                <Select.Item value="or" className="relative flex items-center gap-2 px-6 py-1.5 text-xs text-[rgb(var(--text-color))] rounded-md cursor-pointer select-none data-[highlighted]:bg-[#2135a6] data-[highlighted]:text-white outline-none">
                                  <Select.ItemIndicator className="absolute left-1"><Check size={12} /></Select.ItemIndicator>
                                  <Select.ItemText>Or</Select.ItemText>
                                </Select.Item>
                              </Select.Viewport>
                            </Select.Content>
                          </Select.Portal>
                        </Select.Root>
                      )}
                      {idx > 1 && (
                        <span className="text-xs font-semibold w-12 shrink-0 capitalize text-foreground/70">
                          {currentView?.filterJoinOperator || 'and'}
                        </span>
                      )}`;

code = code.replace(regex, replacement);

fs.writeFileSync(file, code);
