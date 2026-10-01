package com.chaekdami.user.application;

import com.chaekdami.user.domain.Role;
import com.chaekdami.user.domain.User;
import com.chaekdami.user.infrastructure.UserRepository;
import com.chaekdami.user.presentation.dto.SignUpRequest;
import com.chaekdami.user.presentation.dto.UserResponse;
import com.chaekdami.user.presentation.dto.LoginRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public UserResponse signup(SignUpRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
        }

        // TODO: PasswordEncoder 적용
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(request.getPassword())
                .nickname(request.getNickname())
                .role(Role.USER)
                .build();

        User savedUser = userRepository.save(user);
        return new UserResponse(savedUser);
    }

    public UserResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 이메일입니다."));

        // TODO: 추후 PasswordEncoder 도입 시 암호화된 비밀번호와 비교하도록 수정
        if (!user.getPasswordHash().equals(request.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        return new UserResponse(user);
    }
}