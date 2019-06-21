package com.teamderpy.shouldersurfing.math;

import java.util.List;
import java.util.Optional;

import com.teamderpy.shouldersurfing.ShoulderSurfing;
import com.teamderpy.shouldersurfing.config.Config;

import net.minecraft.client.Minecraft;
import net.minecraft.entity.Entity;
import net.minecraft.util.math.AxisAlignedBB;
import net.minecraft.util.math.RayTraceResult;
import net.minecraft.util.math.Vec2f;
import net.minecraft.util.math.Vec3d;
import net.minecraftforge.api.distmarker.Dist;
import net.minecraftforge.api.distmarker.OnlyIn;

@OnlyIn(Dist.CLIENT)
public final class RayTracer
{
	private boolean rayTraceInReach = false;
	private boolean skipPlayerRender = false;
	
	private Vec2f projectedVector = null;
	private Vec3d rayTraceHit = null;
	
	private static final RayTracer INSTANCE = new RayTracer();
	
	public static RayTracer getInstance()
	{
		return INSTANCE;
	}
	
	public void traceFromEyes(final float partialTicks)
	{
		this.projectedVector = null;
		Entity renderView = Minecraft.getInstance().getRenderViewEntity();
		
		if(renderView != null && Minecraft.getInstance().world != null && Minecraft.getInstance().gameSettings.thirdPersonView == Config.CLIENT.getShoulderSurfing3ppId())
		{
			double playerReach = Config.CLIENT.showCrosshairFarther() ? ShoulderSurfing.RAYTRACE_DISTANCE : Minecraft.getInstance().field_71442_b.getBlockReachDistance();
			double blockDist = 0;
			RayTraceResult result = renderView.func_213324_a(playerReach, partialTicks, false);
			
			if(result != null)
			{
				this.rayTraceHit = result.getHitVec();
				blockDist = result.getHitVec().distanceTo(new Vec3d(renderView.posX, renderView.posY, renderView.posZ));
				this.rayTraceInReach = blockDist <= (double) Minecraft.getInstance().field_71442_b.getBlockReachDistance();
			}
			else
			{
				this.rayTraceHit = null;
			}
			
			Vec3d renderViewPos = renderView.getEyePosition(partialTicks);
			Vec3d sightVector = renderView.getLook(partialTicks);
			Vec3d sightRay = renderViewPos.add(sightVector.x * playerReach - 5, sightVector.y * playerReach, sightVector.z * playerReach);
			
			List<Entity> entityList = Minecraft.getInstance().world.getEntitiesWithinAABBExcludingEntity(renderView, renderView.getBoundingBox()
					.expand(sightVector.x * playerReach, sightVector.y * playerReach, sightVector.z * playerReach)
					.expand(1.0D, 1.0D, 1.0D));
			
			for(Entity entity : entityList)
			{
				if(entity.canBeCollidedWith())
				{
					float collisionSize = entity.getCollisionBorderSize();
					AxisAlignedBB aabb = entity.getBoundingBox().expand(collisionSize, collisionSize, collisionSize);
					Optional<Vec3d> intercept = aabb.func_216365_b(renderViewPos, sightRay);
					
					if(intercept.isPresent())
					{
						double entityDist = intercept.get().distanceTo(new Vec3d(renderView.posX, renderView.posY, renderView.posZ));
						
						if(entityDist < blockDist)
						{
							this.rayTraceHit = intercept.get();
							this.rayTraceInReach = entityDist <= (double) Minecraft.getInstance().field_71442_b.getBlockReachDistance();
						}
					}
				}
			}
		}
	}
	
	public boolean isRayTraceInReach()
	{
		return rayTraceInReach;
	}
	
	public void setRayTraceInReach(boolean rayTraceInReach)
	{
		this.rayTraceInReach = rayTraceInReach;
	}
	
	public boolean skipPlayerRender()
	{
		return this.skipPlayerRender;
	}
	
	public void setSkipPlayerRender(boolean skipPlayerRender)
	{
		this.skipPlayerRender = skipPlayerRender;
	}
	
	public Vec2f getProjectedVector()
	{
		return this.projectedVector;
	}
	
	public void setProjectedVector(Vec2f projectedVector)
	{
		this.projectedVector = projectedVector;
	}
	
	public Vec3d getRayTraceHit()
	{
		return this.rayTraceHit;
	}
	
	public void setRayTraceHit(Vec3d rayTraceHit)
	{
		this.rayTraceHit = rayTraceHit;
	}
}
