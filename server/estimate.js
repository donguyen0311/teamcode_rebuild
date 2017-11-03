var tasks = [];


var task = {
	difficulty: 0, //6 level
	
};

/*-----Effort Adjustment Factor-----*/
/*---
	0: very low
	1: low
	2: nominal
	3: high
	4: very high
	5: extremely high
---*/
const EAF = {
	product:{
		RELY:{
			0: {
				value: 0.75,
				description: 'Gây bất tiện nhỏ.'
			},
			1: {
				value: 0.88,
				description: 'Dễ dàng phục hồi hư hỏng, mất mát.'
			},
			2: {
				value: 1,
				description: 'Khả năng phục hồi hư hỏng, mất mát ở mức độ trung bình.'
			},
			3: {
				value: 1.15,
				description: 'Gây ảnh hưởng lớn về tài chính.'
			},
			4: {
				value: 1.39,
				description: 'Gây nguy hiểm đến tính mạng con người.'
			},
			5: 0,
			description: 'Mức độ ảnh hưởng khi phần mềm vận hành sai lệch.'
		},
		DATA:{
			0: 0,
			1: {
				value: 0.93,
				description: 'Testing DB bytes/Pgm SLOC < 10.'
			},
			2: {
				value: 1,
				description: ' 10 <= D/P < 100.'
			},
			3: {
				value: 1.09,
				description: ' 100 <= D/P < 1000.'
			},
			4: {
				value: 1.19,
				description: 'D/P >= 1000.'
			},
			5: 0,
			description: 'Độ lớn của cơ sở dữ liệu.'
		},
		CPLX:{
			0: 0.75,
			1: 0.88,
			2: 1,
			3: 1.15,
			4: 1.30,
			5: 1.66,
			description: 'Độ phức tạp của dự án.'
		},
		RUSE:{
			0: 0,
			1: {
				value: 0.91,
				description: 'Không tái sử dụng.'
			},
			2: {
				value: 1,
				description: 'Tái sử dụng ở mức độ Dự án.'
			}
			3: {
				value:1.14,
				description: 'Tái sử dụng ở mức độ Chương Trình.'
			},
			4: {
				value: 1.29,
				description: 'Tái sử dụng ở mức độ trong một Dòng sản phẩm.'
			},
			5: {
				value: 1.49,
				description: 'Tái sử dụng ở mức độ nhiều Dòng sản phẩm.'
			},
			description: 'Mức độ có thể tái sử dụng khi tiến hành xây dựng các thành phần.'
		},
		DOCU:{
			0: {
				value: 0.89,
				description: 'Many lifecycle needs uncovered.'
			},
			1: {
				value: 0.95,
				description: 'Many lifecycle needs uncovered.'
			},
			2: {
				value: 1,
				description: 'Many lifecycle needs uncovered.'
			},
			3: {
				value: 1.06,
				description: 'Many lifecycle needs uncovered.'
			},
			4: {
				value: 1.13,
				description: 'Many lifecycle needs uncovered.'
			},
			5: 0,
			description: 'Yêu cầu document.'
		}
	},
	platform:{
		TIME:{
			0: 0,
			1: 0,
			2: {
				value: 1,
				description: 'Thời gian thực thi chiếm <= 50% thời gian sẵn sàng.'
			},
			3: {
				value: 1.11,
				description: 'Thời gian thực thi chiếm <= 70% thời gian sẵn sàng.'
			},
			4: {
				value: 1.31,
				description: 'Thời gian thực thi chiếm <= 85% thời gian sẵn sàng.'
			},
			5: {
				value: 1.67
				description: 'Thời gian thực thi chiếm <= 95% thời gian sẵn sàng.'
			},
			description: 'Thời gian thực thi.'
		},
		STOR:{
			0: 0,
			1: 0,
			2: {
				value: 1,
				description: 'Sử dụng <= 50% dung lượng bộ nhớ.'
			},
			3: {
				value: 1.06,
				description: 'Sử dụng <= 70% dung lượng bộ nhớ.'
			},
			4: {
				value: 1.21,
				description: 'Sử dụng <= 85% dung lượng bộ nhớ.'
			},
			5: {
				value: 1.57	
				description: 'Sử dụng <= 95% dung lượng bộ nhớ.'
			},
			description: 'Sử dụng bộ nhớ.'
		},
		PVOL:{
			0: 0,
			1: {
				value: 0.87,
				description: 'Thay đổi LỚN mỗi 12 tháng. Thay đổi NHỎ mỗi 01 tháng.'
			},
				
			2: {
				value: 1,
				description: 'Thay đổi LỚN mỗi 06 tháng. Thay đổi NHỎ mỗi 02 tuần.'
			},
				
			3: {
				value: 1.15,
				description: 'Thay đổi LỚN mỗi 02 tháng. Thay đổi NHỎ mỗi 01 tuần.'
			},
				
			4: {
				value: 1.3,
				description: 'Thay đổi LỚN mỗi 02 tuần. Thay đổi NHỎ mỗi 02 ngày.'
			},
			5: 0,
			description: 'Tính không ổn định của Platform.'
		}
	},
	personnel:{
		ACAP:{
			0: {
				value: 1.5,
				description: '15th percentile.'
			},
			1: {
				value: 0.22,
				description: '35th percentile.'
			},
			2: {
				value: 1,
				description: '55th percentile.'
			},
			3: {
				value: 0.83,
				description: '75th percentile.'
			},
			4: {
				value: 0.67,
				description: '90th percentile.'
			},
			5: 0,
			description: 'Năng lực phân tích.'
		},
		PCAP:{
			0: {
				value: 1.37,
				description: '15th percentile.'
			},
			1: {
				value: 1.16,
				description: '35th percentile.'
			},
			2: {
				value: 1,
				description: '55th percentile.'
			},
			3: {
				value: 0.87,
				description: '75th percentile.'
			},
			4: {
				value: 0.74,
				description: '90th percentile.'
			},
			5: 0,
			description: 'Năng lực lập trình.'
		},
		PCON:{
			0: {
				value: 1.24,
				description: 'Thay thế 48% nhân viên 01 năm.'
			},
			1: {
				value: 1.1,
				description: 'Thay thế 24% nhân viên 01 năm.'
			},
			2: {
				value: 1,
				description: 'Thay thế 12% nhân viên 01 năm.'
			},
			3: {
				value: 0.92,
				description: 'Thay thế 06% nhân viên 01 năm.'
			},
			4: {
				value: 0.84,
				description: 'Thay thế 03% nhân viên 01 năm.'
			},
			5: 0,
			description: 'Tính ổn định nhân lực.'
		},
		APEX:{
			0: {
				value: 1.22,
				description: 'Kinh nghiệm <= 02 tháng.'
			},
			1: {
				value: 1.1,
				description: 'Kinh nghiệm 06 tháng.'
			},
			2: {
				value: 1,
				description: 'Kinh nghiệm 01 năm.'
			},
			3: {
				value: 0.89,
				description: 'Kinh nghiệm 03 năm.'
			},
			4: {
				value: 0.81,
				description: 'Kinh nghiệm 06 năm.'
			},
			5: 0,
			description: 'Kinh nghiệm về ứng dụng.'
		},
		PLEX:{
			0: {
				value: 1.25,
				description: 'Kinh nghiệm <= 02 tháng.'
			},
			1: {
				value: 1.12,
				description: 'Kinh nghiệm 06 tháng.'
			},
			2: {
				value: 1,
				description: 'Kinh nghiệm 01 năm.'
			},
			3: {
				value: 0.88,
				description: 'Kinh nghiệm 03 năm.'
			},
			4: {
				value: 0.81,
				description: 'Kinh nghiệm 06 năm.'
			},
			5: 0,
			description: 'Kinh nghiệm về nền tảng.'
		},
		LTEX:{
			0: {
				value: 1.22,
				description: 'Kinh nghiệm <= 02 tháng.'
			},
			1: {
				value: 1.1,
				description: 'Kinh nghiệm 06 tháng.'
			},
			2: {
				value: 1,
				description: 'Kinh nghiệm 01 năm.'
			},
			3: {
				value: 0.91,
				description: 'Kinh nghiệm 03 năm.'
			},
			4: {
				value: 0.84,
				description: 'Kinh nghiệm 06 năm.'
			},
			5: 0,
			description: 'Kinh nghiệm về sử dụng các công cụ và lập trình.'
		}
	},
	project:{
		TOOL:{
			0: {
				value: 1.24,
				description: 'edit, code, debug.'
			},
			1: {
				value: 1.12,
				description: 'simple frontend, backend CASE, little integration.'
			},
			2: {
				value: 1,
				description: 'basic lifecycle tools, moderately intergrated.'
			},
			3: {
				value: 0.91,
				description: 'strong mature lifecycle tools, moderately intergrated.'
			},
			4: {
				value: 0.84,
				description: 'strong mature proactive lifecycle tools, well intergrated with processes, methods, reuse.'
			},
			5: 0,
			description: 'Lượng công cụ phần mềm sử dụng.'
		},
		SITE:{
			0: 1.25,
			1: 1.1,
			2: 1,
			3: 0.92,
			4: 0.84,
			5: 0.78,
			description: 'Quy mô phát triển phần mềm.'
		},
		SCED:{
			0: {
				value: 1.29,
				description: '75% so với bình thường.'
			},
			1: {
				value: 1.1,
				description: '85% so với bình thường.'
			},
			2: {
				value: 1,
				description: '100% so với bình thường.'
			},
			3: {
				value: 1,
				description: '130% so với bình thường.'
			},
			4: {
				value: 1,
				description: '160% so với bình thường.'
			},
			5: 0,
			description: 'Yêu cầu về kế hoạch phát triển phần mềm.'
		}
	}
};

/*---COEFFICIENT OF INTERMEDITAE COCOMO---*/
const coefficient = {
	organic:{
		a: 3.2,
		b: 1.05,
		c: 2.5,
		d: 0.38
	},
	semi_detached: {
		a: 3,
		b: 1.12,
		c: 2.5,
		d: 0.35
	},
	emmbedded: {
		a: 2.8,
		b: 1.2,
		c: 2.5,
		d: 0.32
	}
};


var input_project = {
	KLOC: 3,
	cocomo_mode: 'organic',
	EAF: {
		product:{
			complexity: 3,
		},
		hardware:{
			storage_constraints: 3
		},
		personnel:{
			applications_experience: 1,
			engineer_capability: 1
		},
		project:{

		}
	}
};


function readProjectParameters(input_project){
	var KLOC = input_project.KLOC;
	var cocomo_mode = input_project.cocomo_mode;
	var EAF_value = 1;
	
	//product, hardware, personel, project

	for (var domain_name in input_project.EAF){
		EAF_value *= caculateDetailCoefficient({
			input_project: input_project,
			domain_name: domain_name
		});
	}
	//E = a * (KLOC)^b *(EAF)
	//E -- persons / months
	var E = coefficient[cocomo_mode].a * Math.pow(KLOC,coefficient[cocomo_mode].b) * EAF_value;

	//D = c * E^d
	//D -- months
	var D = coefficient[cocomo_mode].c * Math.pow(E,coefficient[cocomo_mode].d);

	//D = E/D
	//P -- person/month
	var P = E/D;

	console.log(E);
	console.log(D);
	console.log(P)
}

function caculateDetailCoefficient(input){
	
	var EAF_value = 1;
	for (var criterion_name in input.input_project.EAF[input.domain_name]){
		
		//user input v.low || low || nominal ...
		var rating_level = input.input_project.EAF[input.domain_name][criterion_name];
		
		console.log('const: '+EAF[input.domain_name][criterion_name][rating_level]);

		EAF_value*=EAF[input.domain_name][criterion_name][rating_level];	

		//console.log(EAF[input.domain_name][criterion]);
		//EAF_value*=EAF[input.domain_name][criterion][input.input_project.EAF.domain_name[criterion]];
	}


	console.log(input.domain_name);
	console.log(EAF_value);
	console.log('---');

	return EAF_value;
}		
