<template>
	<view class="content">
		<image class="logIn" mode="aspectFit" src="/static/logInPic.png"></image>
		<view class="text-area">
			<text class="title">{{title}}</text>
		</view>
		<view v-if="!isBound" class="InputAera">
			<view class="inputAera1">
				<view class="PhoneNumberInput">
					<text>手机号</text>
					<input v-model="phone" class="PhoneNumber" rule="^1[0-9]{10,10}$" placeholder="请输入手机号"maxlength="11"/>
				</view>
			</view>
			<view class="inputAera2">
				<view class="TextInput">
					<text>验证码</text>
					<input v-model="verificationCode" class="PhoneNumberTest" required type="number" placeholder="请输入验证码">
					<button class="TestB" size="mini" @click="getVerificationCode" :disabled="countdown > 0">{{countdown > 0 ? `${countdown}s` : '获取验证码'}}</button>
				</view>
			</view>
			<view class="Btn">
				<button class="LogInB" @click="bindAndLogin">登录</button>
			</view>
		</view>		
		<view v-else>
			<view class="phone-info">已绑定手机号：{{boundPhone}}</view>
			<button @click="unbindAndLogin" class="login-btn">登录</button>
			<button @click="unbind" class="unbind-btn">解除绑定</button>
		</view>
	</view>
</template>

<script>
	let value
	export default {
		data() {
			return {
				title: '欢迎使用',
				phone: '',
				boundPhone: '',
				verificationCode: '',
				countdown: 0,
				isBound: false,
			}
		},
		onLoad() {
			this.checkBinding();
		},
		methods: {
		// 点击按钮发送验证码
	async checkBinding() {
				// 获取用户openid
				const {
					code
				} = await uni.login();

				const {
					result: openID
				} = await uniCloud.callFunction({
					name: 'getOpenID',
					data: {
						code
					}
				});
				console.log('已获取验证码发送结果:', openID);
				const {
					result: user
				} = await uniCloud.callFunction({
					name: 'getUserByPhone',
					data: {
						openID
					}
				});
				if (user) {
					this.isBound = true;
					this.boundPhone = user.phone;
				} else {
					this.isBound = false;
				}
			},
			async getVerificationCode() {
				// 获取验证码逻辑
				try {
					const res = await uniCloud.callFunction({
						name: 'sendSmsCode',
						data: {
							msisdn: this.phone
						},
					});
					this.smsCode = res.result;
					console.log('已获取验证码发送结果:', this.smsCode);
				} catch (err) {
					console.error('获取验证码失败:', err);
					uni.showToast({
						title: '获取验证码失败',
						icon: 'none',
					});
				};
				// 这里需要实现短信验证码的相关功能
				this.countdown = 60;
				const timer = setInterval(() => {
					this.countdown--;
					if (this.countdown <= 0) {
						clearInterval(timer);
					}
				}, 1000);
			},
			async bindAndLogin() {
				const {
					result
				} = await uniCloud.callFunction({
					name: 'smsVerification',
					data: {
						verificationCode: this.verificationCode,
						msisdn: this.phone
					}
				});
				console.log('已获取验证码验证结果:', result);
				// 检查返回结果是否成功
				if (result == '104000') { // 根据实际返回结果判断成功的条件
					const {
						code
					} = await uni.login();
					const {
						result: openID
					} = await uniCloud.callFunction({
						name: 'getOpenID',
						data: {
							code
						}
					});
					await uniCloud.callFunction({
						name: 'addUser',
						data: {
							phone: this.phone,
							openID
						}
					});

					// 登录主界面
					uni.showLoading({
						title: '登录中...'
					});

					await uniCloud.callFunction({
						name: 'cloud_login',
						data: {
							phoneNumber: this.phone,
						},
						success: res => {
							console.log(res);
							if (res.result.code === 0) {
								uni.setStorageSync('userInfo', res.result.data);
								uni.hideLoading();
								uni.showToast({
									title: '登录成功',
									icon: 'success'
								});
								wx.reLaunch({
									url: '/pages/myuser/myuser'
								});
							} else {
								uni.hideLoading();
								uni.showToast({
									title: res.result.msg,
									icon: 'none'
								});
							}
						},
						fail: err => {
							console.log(err);
							uni.hideLoading();
							uni.showToast({
								title: '登录失败',
								icon: 'none'
							});
						}
					});
				} else {
					// 验证码错误
					uni.showToast({
						title: '验证码或手机号输入错误',
						icon: 'none'
					});
				}
			},
			async unbindAndLogin() {
				// 登录主界面
				uni.showLoading({
					title: '登录中...'
				});

				await uniCloud.callFunction({
					name: 'cloud_login',
					data: {
						phoneNumber: this.boundPhone,
					},
					success: res => {
						console.log(res);
						if (res.result.code === 0) {
							uni.setStorageSync('userInfo', res.result.data);
							uni.hideLoading();
							uni.showToast({
								title: '登录成功',
								icon: 'success'
							});
							wx.reLaunch({
								url: '/pages/messageSearch/messageSearch'
							});
						} else {
							uni.hideLoading();
							uni.showToast({
								title: res.result.msg,
								icon: 'none'
							});
						}
					},
					fail: err => {
						console.log(err);
						uni.hideLoading();
						uni.showToast({
							title: '登录失败',
							icon: 'none'
						});
					}
				});
			},
			async unbind() {
				const {
					code
				} = await uni.login();
				const {
					result: openID
				} = await uniCloud.callFunction({
					name: 'getOpenID',
					data: {
						code
					}
				});
				await uniCloud.callFunction({
					name: 'unbindOpenID',
					data: {
						openID
					}
				});
				this.checkBinding();
			}
		}
	}
</script>

<style>
	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.logIn {
		height: 500rpx;
		width: 750rpx;
		margin-top: 0rpx;
		margin-left: auto;
		margin-right: auto;
		margin-bottom: 50rpx;
	}

	.text-area {
		display: flex;
		justify-content: center;
	}

	.title {
		font-size: 36rpx;
		color: #8f8f94;
	}
	.InputAera{
		flex: flex;
		flex-direction: column;
	}
	.inputAera1{
		width: 600rpx;
		height:100rpx;
		margin-top: 50rpx;
		display: flex;
		flex-direction: column;
		justify-content: space-evenly;
	}
	.inputAera2{
		width: 600rpx;
		height:100rpx;

	}
	.TextInput{
		display: flex;
				justify-content: center;
	}
	input{
		/* border: 1px solid #000; */
	}
	.PhoneNumberInput{
		display: flex;
	}
	.PhoneTestInput{
		display: flex;
	}
	.PhoneNumber{
		width: 250rpx;
		margin-bottom: 50rpx;
		margin-left: 20rpx;
	}
	.PhoneNumberTest{
		width: 200rpx;
		margin-left: 20rpx;
	}
	.TestB{
		width: 240rpx;
		height: 60rpx;
		border-radius: 20rpx;
	}
	.LogInB{
		margin-top: 30rpx;
		color: #2b7bf5;
	}
</style>
<style scoped>

</style>
/
