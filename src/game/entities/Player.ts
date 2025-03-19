import Phaser from "phaser";

export class Player {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public health: number = 100;
  private scene: Phaser.Scene;
  private nameText: Phaser.GameObjects.Text;
  private healthBar: Phaser.GameObjects.Graphics;
  private speedBoostTimer: number | null = null;
  private normalSpeed: number = 200;
  private boostedSpeed: number = 300;
  private id: string;
  private name: string;
  private isLocalPlayer: boolean;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasdKeys: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  } | null = null;
  
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    name: string,
    id: string
  ) {
    this.scene = scene;
    this.id = id;
    this.name = name;
    this.isLocalPlayer = id === (scene as any).myAccount;
    
    // Create sprite
    this.sprite = scene.physics.add.sprite(x, y, texture);
    this.sprite.setScale(0.5);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setData("id", id);
    
    // Create name text
    this.nameText = scene.add.text(x, y - 30, name, {
      fontSize: "14px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3
    });
    this.nameText.setOrigin(0.5);
    
    // Create health bar
    this.healthBar = scene.add.graphics();
    
    // Set depth to ensure player is above background but below UI
    this.sprite.setDepth(10);
    this.nameText.setDepth(11);
    this.healthBar.setDepth(11);
    
    // Initialize input controls for local player
    if (this.isLocalPlayer) {
      this.initializeControls();
    }
  }
  
  private initializeControls() {
    // Initialize cursor keys
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    
    // Initialize WASD keys
    this.wasdKeys = {
      up: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
  }
  
  update() {
    // Update name text and health bar position
    this.nameText.setPosition(this.sprite.x, this.sprite.y - 30);
    this.updateHealthBar();
    
    // Handle movement for local player
    if (this.isLocalPlayer) {
      this.handleMovement();
      this.handleRotation();
    }
  }
  
  private handleMovement() {
    if (!this.cursors || !this.wasdKeys) return;
    
    // Reset velocity
    this.sprite.setVelocity(0);
    
    // Get current speed (normal or boosted)
    const speed = this.speedBoostTimer !== null ? this.boostedSpeed : this.normalSpeed;
    
    // Apply movement based on input
    if (this.cursors.left.isDown || this.wasdKeys.left.isDown) {
      this.sprite.setVelocityX(-speed);
    } else if (this.cursors.right.isDown || this.wasdKeys.right.isDown) {
      this.sprite.setVelocityX(speed);
    }
    
    if (this.cursors.up.isDown || this.wasdKeys.up.isDown) {
      this.sprite.setVelocityY(-speed);
    } else if (this.cursors.down.isDown || this.wasdKeys.down.isDown) {
      this.sprite.setVelocityY(speed);
    }
    
    // Normalize diagonal movement
    if (this.sprite.body.velocity.x !== 0 || this.sprite.body.velocity.y !== 0) {
      this.sprite.body.velocity.normalize().scale(speed);
    }
  }
  
  private handleRotation() {
    // Rotate player to face mouse pointer
    const pointer = this.scene.input.activePointer;
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x,
      this.sprite.y,
      this.scene.cameras.main.scrollX + pointer.x,
      this.scene.cameras.main.scrollY + pointer.y
    );
    
    this.sprite.setRotation(angle);
  }
  
  moveTo(x: number, y: number) {
    // For non-local players, smoothly move to the target position
    this.scene.tweens.add({
      targets: this.sprite,
      x: x,
      y: y,
      duration: 100,
      ease: "Linear"
    });
  }
  
  damage(amount: number) {
    this.health = Math.max(0, this.health - amount);
    
    // Emit event for UI updates
    this.scene.events.emit("updateHealth", this.health);
    
    // Visual feedback
    this.scene.cameras.main.shake(100, 0.01);
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.sprite.clearTint();
    });
  }
  
  heal(amount: number) {
    this.health = Math.min(100, this.health + amount);
    
    // Emit event for UI updates
    this.scene.events.emit("updateHealth", this.health);
    
    // Visual feedback
    this.sprite.setTint(0x00ff00);
    this.scene.time.delayedCall(100, () => {
      this.sprite.clearTint();
    });
  }
  
  applySpeedBoost(duration: number) {
    // Clear existing timer if any
    if (this.speedBoostTimer !== null) {
      this.scene.time.removeEvent(this.speedBoostTimer);
    }
    
    // Apply visual effect
    this.sprite.setTint(0x00ffff);
    
    // Set timer to remove boost after duration
    this.speedBoostTimer = this.scene.time.delayedCall(duration, () => {
      this.sprite.clearTint();
      this.speedBoostTimer = null;
    });
  }
  
  setHealth(health: number) {
    this.health = health;
    this.updateHealthBar();
  }
  
  reset() {
    this.health = 100;
    this.scene.events.emit("updateHealth", this.health);
    this.sprite.clearTint();
    
    // Clear speed boost if active
    if (this.speedBoostTimer !== null) {
      this.scene.time.removeEvent(this.speedBoostTimer);
      this.speedBoostTimer = null;
    }
  }
  
  destroy() {
    this.sprite.destroy();
    this.nameText.destroy();
    this.healthBar.destroy();
  }
  
  private updateHealthBar() {
    this.healthBar.clear();
    
    // Draw background
    this.healthBar.fillStyle(0x000000, 0.5);
    this.healthBar.fillRect(this.sprite.x - 25, this.sprite.y - 20, 50, 5);
    
    // Draw health amount
    if (this.health > 60) {
      this.healthBar.fillStyle(0x00ff00, 1);
    } else if (this.health > 30) {
      this.healthBar.fillStyle(0xffff00, 1);
    } else {
      this.healthBar.fillStyle(0xff0000, 1);
    }
    
    const width = Math.max(0, (this.health / 100) * 50);
    this.healthBar.fillRect(this.sprite.x - 25, this.sprite.y - 20, width, 5);
  }
}
