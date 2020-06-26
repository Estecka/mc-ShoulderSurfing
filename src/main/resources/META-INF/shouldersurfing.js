function initializeCoreMod() {
	var ASMAPI = Java.type('net.minecraftforge.coremod.api.ASMAPI');
	
	var InsnList = Java.type('org.objectweb.asm.tree.InsnList');
	var AbstractInsnNode = Java.type('org.objectweb.asm.tree.AbstractInsnNode');
	var Label = Java.type('org.objectweb.asm.Label');
	
	var Opcodes = Java.type('org.objectweb.asm.Opcodes');
	var InsnNode = Java.type('org.objectweb.asm.tree.InsnNode');
	var FieldInsnNode = Java.type('org.objectweb.asm.tree.FieldInsnNode');
	var FrameNode = Java.type('org.objectweb.asm.tree.FrameNode');
	var IincInsnNode = Java.type('org.objectweb.asm.tree.IincInsnNode');
	var IntInsnNode = Java.type('org.objectweb.asm.tree.IntInsnNode');
	var InvokeDynamicInsnNode = Java.type('org.objectweb.asm.tree.InvokeDynamicInsnNode');
	var JumpInsnNode = Java.type('org.objectweb.asm.tree.JumpInsnNode');
	var LabelNode = Java.type('org.objectweb.asm.tree.LabelNode');
	var LdcInsnNode = Java.type('org.objectweb.asm.tree.LdcInsnNode');
	var LineNumberNode = Java.type('org.objectweb.asm.tree.LineNumberNode');
	var LookupSwitchInsnNode = Java.type('org.objectweb.asm.tree.LookupSwitchInsnNode');
	var MethodInsnNode = Java.type('org.objectweb.asm.tree.MethodInsnNode');
	var MethodNode = Java.type('org.objectweb.asm.tree.MethodNode');
	var MultiANewArrayInsnNode = Java.type('org.objectweb.asm.tree.MultiANewArrayInsnNode');
	var TableSwitchInsnNode = Java.type('org.objectweb.asm.tree.TableSwitchInsnNode');
	var TypeInsnNode = Java.type('org.objectweb.asm.tree.TypeInsnNode');
	var VarInsnNode = Java.type('org.objectweb.asm.tree.VarInsnNode');
	
	function transformMethod(method, config) {
		var instructions = method.instructions;
		var offset = findInstruction(instructions, config.searchList, 0, 0, instructions.size());
		
		if(offset) {
			for(var x = 0; x < config.transformList.length; x++) {
				config.transformer(instructions, offset, config.transformList[x]);
			}
		} else {
			ASMAPI.log("ERROR", "Could not find instruction offset for method " + method.name);
		}
		
		return method;
	}
	
	function findInstruction(instructions, search, searchNdx, startAt, limit) {
		var attempts = 0;
		
		for(var i = startAt; i < instructions.size() && attempts < limit; i++) {
			var instruction = instructions.get(i);
			
			if(instruction.getType() == AbstractInsnNode.LABEL || instruction.getType() == AbstractInsnNode.LINE) {
				continue;
			}
			
			var match = false;
			var searchNode = search[searchNdx];
			
			if(instruction.getType() == searchNode.getType()) {
				if(instruction.getType() == AbstractInsnNode.FIELD_INSN) {
					if(instruction.desc.equals(searchNode.desc) && instruction.name.equals(searchNode.name) && instruction.owner.equals(searchNode.owner)) {
						match = true;
					}
				} else if(instruction.getType() == AbstractInsnNode.VAR_INSN) {
					if(instruction.var == searchNode.var && instruction.getOpcode() == searchNode.getOpcode()) {
						match = true;
					}
				} else if(instruction.getType() == AbstractInsnNode.INSN) {
					if(instruction.getOpcode() == searchNode.getOpcode()) {
						match = true;
					}
				} else if(instruction.getType() == AbstractInsnNode.METHOD_INSN) {
					if(instruction.desc.equals(searchNode.desc) && instruction.name.equals(searchNode.name) && instruction.owner.equals(searchNode.owner)) {
						match = true;
					}
				} else if(instruction.getType() == AbstractInsnNode.INT_INSN) {
					if(instruction.getOpcode() == searchNode.getOpcode() && instruction.operand == searchNode.operand) {
						match = true;
					}
				} else if(instruction.getType() == AbstractInsnNode.IINC_INSN) {
					if(instruction.getOpcode() == searchNode.getOpcode() && instruction.var == searchNode.var && instruction.incr == searchNode.incr) {
						match = true;
					}
				} else if(instruction.getType() == AbstractInsnNode.LDC_INSN) {
					if(instruction.cst == searchNode.cst) {
						match = true;
					}
				} else if(instruction.getType() == AbstractInsnNode.TYPE_INSN) {
					if(instruction.getOpcode() == searchNode.getOpcode() && instruction.desc == searchNode.desc) {
						match = true;
					}
				} else if(instruction.getType() == AbstractInsnNode.JUMP_INSN) {
					if(instruction.getOpcode() == searchNode.getOpcode() && instruction.label == searchNode.label) {
						match = true;
					}
				}
				
				// INVOKE_DYNAMIC_INSN
				// TABLESWITCH_INSN
				// LOOKUPSWITCH_INSN
				// MULTIANEWARRAY_INSN
			}
			
			if(match) {
				if(searchNdx < search.length - 1) {
					var next = findInstruction(instructions, search, searchNdx + 1, i + 1, 1);
					
					if(next) {
						return next;
					}
				} else {
					return instruction;
				}
			} else {
				attempts++;
			}
		}
		
		return null;
	}
	
	return {
		'PlayerEntity#pick': {
			'target': {
				'type': 'CLASS',
				'name': 'net.minecraft.entity.player.PlayerEntity'
			},
			'transformer': function(classNode) {
				var methods = classNode.methods;
				
				//	public RayTraceResult pick(double distance, float partialTicks, boolean stopOnFluid)
				//	{
				//		return InjectionDelegation.pick(this, super.pick(distance, partialTicks, stopOnFluid), distance, partialTicks, stopOnFluid);
				//	}
				
				//	public pick(DFZ)Lnet/minecraft/util/math/RayTraceResult;
				//		L0
				//			LINENUMBER 90 L0
				//			ALOAD 0
				//			ALOAD 0
				//			DLOAD 1
				//			FLOAD 3
				//			ILOAD 4
				//			INVOKESPECIAL Lnet/minecraft/entity/Entity.pick(DFZ)Lnet/minecraft/util/math/RayTraceResult;
				//			DLOAD 1
				//			FLOAD 3
				//			ILOAD 4
				//			INVOKESTATIC com/teamderpy/shouldersurfing/asm/InjectionDelegation.pick(Lnet/minecraft/entity/Entity;Lnet/minecraft/util/math/RayTraceResult;DFZ)Lnet/minecraft/util/math/RayTraceResult;
				//			ARETURN
				
				var name = ASMAPI.mapMethod("func_213324_a");
				var method = new MethodNode(Opcodes.ACC_PUBLIC, name, "(DFZ)Lnet/minecraft/util/math/RayTraceResult;", null, null);
				
				method.instructions.add(new LabelNode(new Label()));
				method.instructions.add(new VarInsnNode(Opcodes.ALOAD, 0));
				method.instructions.add(new VarInsnNode(Opcodes.ALOAD, 0));
				method.instructions.add(new VarInsnNode(Opcodes.DLOAD, 1));
				method.instructions.add(new VarInsnNode(Opcodes.FLOAD, 3));
				method.instructions.add(new VarInsnNode(Opcodes.ILOAD, 4));
				method.instructions.add(new MethodInsnNode(Opcodes.INVOKESPECIAL, "net/minecraft/entity/Entity", name, "(DFZ)Lnet/minecraft/util/math/RayTraceResult;", false));
				method.instructions.add(new VarInsnNode(Opcodes.DLOAD, 1));
				method.instructions.add(new VarInsnNode(Opcodes.FLOAD, 3));
				method.instructions.add(new VarInsnNode(Opcodes.ILOAD, 4));
				method.instructions.add(new MethodInsnNode(Opcodes.INVOKESTATIC, "com/teamderpy/shouldersurfing/asm/InjectionDelegation", "pick", "(Lnet/minecraft/entity/Entity;Lnet/minecraft/util/math/RayTraceResult;DFZ)Lnet/minecraft/util/math/RayTraceResult;", false));
				method.instructions.add(new InsnNode(Opcodes.ARETURN));
				
				methods.add(method);
				
				return classNode;
			}
		},
		'IngameGui#renderAttackIndicator': {
			'target': {
				'type': 'METHOD',
				'class': 'net.minecraft.client.gui.IngameGui',
				'methodName': 'func_238456_d_', // renderAttackIndicator
				'methodDesc': '(Lcom/mojang/blaze3d/matrix/MatrixStack;)V'
			},
			'transformer': function(method) {
				// if(InjectionDelegation.doRenderCrosshair() == 0)
				return transformMethod(method, {
					'searchList': [
						new VarInsnNode(Opcodes.ALOAD, 2),
						new FieldInsnNode(Opcodes.GETFIELD, "net/minecraft/client/GameSettings", ASMAPI.mapField("field_74320_O"), "I") // thirdPersionView
					],
					'transformList': [
						new MethodInsnNode(Opcodes.INVOKESTATIC, "com/teamderpy/shouldersurfing/asm/InjectionDelegation", "doRenderCrosshair", "()I", false)
					],
					'transformer': function(instructions, offset, instruction) {
						instructions.set(offset, instruction);
						instructions.remove(instruction.getPrevious());
					}
				});
			}
		}
	}
}