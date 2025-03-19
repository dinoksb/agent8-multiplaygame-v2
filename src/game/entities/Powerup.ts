import Phaser from "phaser";

export class Powerup {
  public sprite: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private id: string;
  private type: string;
  
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    id: string,
    type: string
  ) {
    this.scene = scene;
    this.id = id;
    this.type = type;
    
    // Create sprite with null check
    if (!scene || !scene.physics) {
      console.error("Scene or physics is not initialized in Powerup constructor");
      // Create a dummy sprite to prevent null reference errors
      this.sprite = new Phaser.Physics.Arcade.Sprite(scene, 0, 0, '');
      return;
    }
    
    // Create sprite
    this.sprite = scene.physics.add.sprite(x, y, texture);
    
    // Set properties only if sprite was created successfully
    if (this.sprite) {
      this.sprite.setScale(0.5);
      this.sprite.setData("id", id);
      this.sprite.setData("type", type);
      
      // Add glow effect
      this.sprite.setTint(type === "health" ? 0xff0000 : 0x00ffff);
      
      // Add floating animation
      scene.tweens.add({
        targets: this.sprite,
        y: y - 10,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
      
      // Add rotation
      scene.tweens.add({
        targets: this.sprite,
        angle: 360,
        duration: 3000,
        repeat: -1,
        ease: "Linear"
      });
      
      // Set depth to ensure powerup is above background
      this.sprite.setDepth(5);
    }
  }
  
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}
